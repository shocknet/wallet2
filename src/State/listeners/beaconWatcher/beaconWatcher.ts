import { listenerKick } from "@/State/listeners/actions";
import { selectSourceViewById, selectSourceViews, selectSourceViewsByLpk } from "@/State/scoped/backups/sources/selectors";
import { getNostrClient, subToBeacons } from "@/Api/nostr";
import logger from "@/Api/helpers/logger";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { ListenerSpec } from "../lifecycle/lifecycle";
import { ListenerEffectAPI, TaskAbortError } from "@reduxjs/toolkit";
import { fetchBeaconDiscovery } from "@/Api/nostrHandler";
import { BEACON_STALE_OLDER_THAN } from "@/State/scoped/backups/sources/state";
import { runtimeActions } from "@/State/runtime/slice";
import { AppDispatch, RootState } from "@/State/store/store";
import { sourceJustAdded } from "../predicates";


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
									data: res.data,
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
		// Source just newly added
		(add) =>
			add({
				predicate: (action, curr, prev) =>
					sourceJustAdded(action, curr, prev),
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload as { sourceId: string };


					const source = selectSourceViewById(listenerApi.getState(), sourceId);
					if (!source) return;

					const toProbe = [
						{
							sourceId,
							lpk: source.lpk,
							relays: source.relays
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

					const views = selectSourceViews(state);


					const toProbe: { sourceId: string; lpk: string; relays: string[] }[] = [];

					for (const view of views) {
						if (!view.relays.length) continue;
						if (nowMs - view.beaconLastSeenAtMs > BEACON_STALE_OLDER_THAN) { // Only take sources that are not fresh
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


					const sources = selectSourceViews(listenerApi.getState());
					/*
						subToBeacons lives on the clientsCluster layer, however since some sources might be stale they may never
						get to have a nostrClient, in which case we won't be able to listen for their beacons. So make sure all sources have a nostrClient.
					*/
					await Promise.allSettled(sources.map(s => getNostrClient({ pubkey: s.lpk, relays: s.relays }, s.keys)));

					const unsub = subToBeacons(b => {
						if (listenerApi.signal.aborted) return;

						const { relayUrl, createdByPub: lpk, data, updatedAtUnix } = b;
						const seenAtMs = updatedAtUnix * 1_000;

						const s = listenerApi.getState();
						const lpkSources = selectSourceViewsByLpk(s, lpk);

						for (const lpkSource of lpkSources) {
							// Update only sources whose relay set includes the relay we heard this on
							if (!lpkSource.relays.includes(relayUrl)) continue;

							listenerApi.dispatch(
								sourcesActions.recordBeaconForSource({
									sourceId: lpkSource.sourceId,
									data,
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
								const views = selectSourceViews(state);

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
