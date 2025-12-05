import { listenerKick } from "@/State/listeners/actions";
import { selectNprofileViews } from "@/State/scoped/backups/sources/selectors";
import { getAllNostrClients, getNostrClient, subToBeacons } from "@/Api/nostr";
import logger from "@/Api/helpers/logger";
import { metadataSelectors, sourcesActions } from "@/State/scoped/backups/sources/slice";
import { ListenerSpec } from "../lifecycle/lifecycle";
import { isAnyOf, TaskAbortError } from "@reduxjs/toolkit";
import { fetchBeaconDiscovery } from "@/helpers/remoteBackups";
import { NprofileSourceDocV0 } from "@/State/scoped/backups/sources/schema";
import { BEACON_STALE_OLDER_THAN } from "@/State/scoped/backups/sources/state";
import { isNprofileSource, isSourceDeleted } from "@/State/utils";


const STALE_TICK_MS = 0.7 * 60 * 1000;


const isBeaconTrigger = isAnyOf(
	sourcesActions._createDraftDoc,
	sourcesActions.applyRemoteSource
);

export const beaconWatcherSpec: ListenerSpec = {
	name: "beaconWatcher",
	listeners: [
		(add) =>
			add({
				predicate: (action, state) => {
					if (!isBeaconTrigger(action)) return false;

					const { sourceId } = action.payload;
					const source = state.scoped!.sources.docs.entities[sourceId]?.draft;
					if (!isNprofileSource(source) || isSourceDeleted(source))
						return false;

					return true;
				},
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload as { sourceId: string };

					const d = listenerApi.getState().scoped!.sources.docs.entities[sourceId].draft as NprofileSourceDocV0;

					const task = listenerApi.fork(async forkApi => {
						const beaconRes = await forkApi.pause(fetchBeaconDiscovery(d.lpk, Object.keys(d.relays).filter(u => d.relays[u]?.present)));
						if (beaconRes === null) return;

						if (!forkApi.signal.aborted) {
							listenerApi.dispatch(sourcesActions.recordBeaconForSource({
								sourceId: d.source_id,
								name: beaconRes.name,
								seenAtMs: beaconRes.beaconLastSeenAtMs
							}));
						}
					});

					await task.result;
				}
			}),
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {
					const lpkToUnixMap = new Map<string, number>();

					const nprofiles = selectNprofileViews(listenerApi.getState());
					/*
						subToBeacons lives on the clientsCluster layer, however since some sources might be stale they may never
						get to have a nostrClient, in which case we won't be able to listen for their beacons. So make sure all sources have a nostrClient.
					*/
					await Promise.allSettled(nprofiles.map(s => getNostrClient({ pubkey: s.lpk, relays: s.relays }, s.keys)));

					subToBeacons(b => {
						const { createdByPub: lpk, name, updatedAtUnix } = b;
						/* Some pubs may operate on multiple relays, and so we might
							receive the same beacon on multiple relays unnecessarily.
							So a small optimization here to ignore values we have already recorded
						*/
						if (lpkToUnixMap.has(lpk) && lpkToUnixMap.get(lpk) === updatedAtUnix)
							return;
						lpkToUnixMap.set(lpk, updatedAtUnix);


						if (!listenerApi.signal.aborted) {
							const metadata = metadataSelectors.selectAll(listenerApi.getState());
							metadata.filter(m => m.lpk === lpk).forEach(m => {
								listenerApi.dispatch(sourcesActions.recordBeaconForSource({
									sourceId: m.id,
									name,
									seenAtMs: updatedAtUnix * 1_000,
								}))
							});
						}
					});

					await listenerApi.take(() => false); // block. take reacts to cancel from lifecycle
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

								const now = Date.now();

								const currentStaleLpks = new Set(
									views
										.filter(v => now - v.beaconLastSeenAtMs > BEACON_STALE_OLDER_THAN)
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
										.filter(c => newlyStaleLpks.includes(c.pubDestination))
										.forEach(c => {
											try {
												c.disconnectCalls("Stale beacon from pub");
											} catch {
												/* noop */
											}
										});

									if (!forkApi.signal.aborted) {
										listenerApi.dispatch(sourcesActions.triggerStaleRecompute({
											lpk: newlyStaleLpks[0],
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
