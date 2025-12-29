import { listenerKick } from "@/State/listeners/actions";
import { selectNprofileViews } from "@/State/scoped/backups/sources/selectors";
import { getAllNostrClients, getNostrClient, subToBeacons } from "@/Api/nostr";
import logger from "@/Api/helpers/logger";
import { docsSelectors, metadataSelectors, sourcesActions } from "@/State/scoped/backups/sources/slice";
import { ListenerSpec } from "../lifecycle/lifecycle";
import { isAnyOf, ListenerEffectAPI, TaskAbortError } from "@reduxjs/toolkit";
import { fetchBeaconDiscovery } from "@/helpers/remoteBackups";
import { NprofileSourceDocV0 } from "@/State/scoped/backups/sources/schema";
import { BEACON_STALE_OLDER_THAN } from "@/State/scoped/backups/sources/state";
import { isNewSourceAddition, isNprofileSource, } from "@/State/utils";
import { runtimeActions } from "@/State/runtime/slice";
import { AppDispatch, RootState } from "@/State/store/store";


const STALE_TICK_MS = 0.7 * 60 * 1000;


const probeBeacon = (
	toProbe: { sourceId: string; lpk: string; relays: string[] }[],
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
) => {


	const epoch = Date.now();

	// Mark all sources to probe as warming up.
	// i.e. not stale nor fresh
	listenerApi.dispatch(
		sourcesActions.startBeaconProbeForSources({
			sourceIds: toProbe.map(x => x.sourceId),
			epoch,
		}),
	);


	// Probe in parallel with a small concurrency cap.
	// This is because relays cap subscriptions from a single connection

	const CONCURRENCY = 3;
	let i = 0;

	const task = listenerApi.fork(async forkApi => {
		await Promise.allSettled(
			new Array(CONCURRENCY).fill(0).map(async () => {
				while (i < toProbe.length && !listenerApi.signal.aborted) {
					const item = toProbe[i++];

					try {

						const res = await forkApi.pause(fetchBeaconDiscovery(item.lpk, item.relays));



						if (res) {
							listenerApi.dispatch(
								sourcesActions.recordBeaconForSource({
									sourceId: item.sourceId,
									name: res.name,
									seenAtMs: res.beaconLastSeenAtMs,
								}),
							);

							listenerApi.dispatch(
								sourcesActions.finishBeaconProbeForSource({
									sourceId: item.sourceId,
									epoch,
								}),
							);
						} else {
							listenerApi.dispatch(
								sourcesActions.finishBeaconProbeForSource({
									sourceId: item.sourceId,
									epoch,
								}),
							);
						}
					} catch (err) {
						if (err instanceof TaskAbortError) return;

						if (listenerApi.signal.aborted) return;
						listenerApi.dispatch(
							sourcesActions.finishBeaconProbeForSource({
								sourceId: item.sourceId,
								epoch,
							}),
						);
					}

				}
			})
		)
	});
	return task;
}


export const beaconWatcherSpec: ListenerSpec = {
	name: "beaconWatcher",
	listeners: [
		// New Source additions
		(add) =>
			add({
				predicate: (action, curr, prev) => {
					if (
						!(isAnyOf(
							sourcesActions._createDraftDoc,
							sourcesActions.applyRemoteSource
						)(action))
					) return false;

					const { sourceId } = action.payload;
					const isSourceAddition = isNewSourceAddition(curr, prev, sourceId);

					if (!isSourceAddition) return false;

					const source = docsSelectors.selectById(curr, sourceId)?.draft;
					if (!isNprofileSource(source))
						return false;

					return true;
				},
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload as { sourceId: string };


					const d = docsSelectors.selectById(listenerApi.getState(), sourceId)?.draft as NprofileSourceDocV0;

					const toProbe = [
						{
							sourceId,
							lpk: d.lpk,
							relays: Object.keys(d.relays).filter(u => d.relays[u]?.present)
						}
					];

					const task = probeBeacon(toProbe, listenerApi)

					await task.result;
				}
			}),

		// On app boot and app resume
		(add) =>
			add({
				predicate: (action) => {
					return listenerKick.match(action) || (runtimeActions.setAppActiveStatus.match(action) && action.payload.active)
				},
				effect: async (_, listenerApi) => {

					listenerApi.cancelActiveListeners()

					await listenerApi.delay(15);


					const state = listenerApi.getState();
					const nowMs = Date.now();

					const views = selectNprofileViews(state);


					const toProbe: { sourceId: string; lpk: string; relays: string[] }[] = [];

					for (const view of views) {
						if (!view.relays.length) continue;
						if (nowMs - view.beaconLastSeenAtMs > BEACON_STALE_OLDER_THAN) { // Only take sources that are stale
							toProbe.push({ sourceId: view.sourceId, lpk: view.lpk, relays: view.relays });
						}
					}

					if (!toProbe.length) return;

					const task = probeBeacon(toProbe, listenerApi);
					await task.result;
				},
			}),
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {


					const nprofiles = selectNprofileViews(listenerApi.getState());
					/*
						subToBeacons lives on the clientsCluster layer, however since some sources might be stale they may never
						get to have a nostrClient, in which case we won't be able to listen for their beacons. So make sure all sources have a nostrClient.
					*/
					await Promise.allSettled(nprofiles.map(s => getNostrClient({ pubkey: s.lpk, relays: s.relays }, s.keys)));

					const unsub = subToBeacons(b => {
						if (listenerApi.signal.aborted) return;

						const { relayUrl, createdByPub: lpk, name, updatedAtUnix } = b;
						const seenAtMs = updatedAtUnix * 1_000;

						const s = listenerApi.getState();
						const metadata = metadataSelectors.selectAll(s);


						for (const m of metadata) {
							if (m.lpk !== lpk) continue;


							const source = s.scoped!.sources.docs.entities[m.id]?.draft as NprofileSourceDocV0 | undefined;
							if (!source) continue;

							// Update only sources whose relay set includes the relay we heard this on
							const relays = Object.keys(source.relays).filter(u => source.relays[u]?.present);
							if (!relays.includes(relayUrl)) continue;

							listenerApi.dispatch(
								sourcesActions.recordBeaconForSource({
									sourceId: m.id,
									name,
									seenAtMs,
								})
							);

						}
					});

					try {
						await listenerApi.take(() => false);
					} finally {
						try { unsub(); } catch { /* no-op */ }
					}
				}
			}),
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {
					let prevStaleLpks = new Set<string>();

					const task = listenerApi.fork(async forkApi => {
						try {
							for (; ;) {
								await forkApi.delay(STALE_TICK_MS);
								const state = listenerApi.getState();
								const views = selectNprofileViews(state);

								const nowMs = Date.now();

								const currentStaleLpks = new Set(
									views
										.filter(v => nowMs - v.beaconLastSeenAtMs > BEACON_STALE_OLDER_THAN)
										.map(v => v.lpk)
								);

								const newlyStaleLpks: string[] = [];
								currentStaleLpks.forEach(lpk => {
									if (!prevStaleLpks.has(lpk)) {
										newlyStaleLpks.push(lpk);
									}
								});

								if (newlyStaleLpks.length) {
									const clients = getAllNostrClients();
									clients
										.filter(c => newlyStaleLpks.includes(c.getLpk()))
										.forEach(c => {
											try {
												c.disconnectCalls("Stale beacon from pub");
											} catch {
												/* noop */
											}
										});

									if (!forkApi.signal.aborted) {
										listenerApi.dispatch(runtimeActions.clockTick({
											nowMs
										}));
									}
								}

								prevStaleLpks = currentStaleLpks;
							}
						} catch (err) {
							if (err instanceof TaskAbortError) {
								logger.info(`[${beaconWatcherSpec.name}] cancelled normally`)
							} else if (err instanceof Error) {
								logger.error(`[${beaconWatcherSpec.name}] error: ${err.message}`)
							}
						}
					});

					await task.result;
				}
			})
	],
}
