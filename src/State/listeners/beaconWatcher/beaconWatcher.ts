import { listenerKick } from "@/State/listeners/actions";
import { selectSourceViewById, selectSourceViews, type SourceView } from "@/State/scoped/backups/sources/selectors";
import { getNostrClient, subToBeacons } from "@/Api/nostr";
import logger from "@/Api/helpers/logger";
import { ListenerSpec } from "../lifecycle/lifecycle";
import { ListenerEffectAPI, TaskAbortError } from "@reduxjs/toolkit";
import { fetchBeaconDiscovery } from "@/Api/nostrHandler";
import { BEACON_STALE_OLDER_THAN } from "@/State/scoped/beacons/state";
import { runtimeActions } from "@/State/runtime/slice";
import { AppDispatch, RootState } from "@/State/store/store";
import { sourceJustAdded, sourceJustDeleted } from "../predicates";
import { beaconsActions, beaconNodesSelectors } from "@/State/scoped/beacons/slice";
import { canonicalRelayUrl } from "@/State/scoped/beacons/relays";
import { beaconLookupKey } from "@/State/scoped/beacons/state";


const STALE_TICK_MS = 0.7 * 60 * 1000;

type RelayPair = { lpk: string; relay: string };

const uniquePairs = (items: RelayPair[]) => {
	const byKey = new Map<string, RelayPair>();
	for (const item of items) {
		byKey.set(beaconLookupKey(item.lpk, item.relay), item);
	}
	return [...byKey.values()];
};

const pairsFromViews = (views: SourceView[]) =>
	uniquePairs(views.flatMap(v => v.relays.map(relay => ({ lpk: v.lpk, relay }))));

const isLastSeenStale = (lastSeenAtMs: number, nowMs: number) =>
	nowMs - lastSeenAtMs > BEACON_STALE_OLDER_THAN;

const staleSourceIds = (views: SourceView[], nowMs: number) => {
	const set = new Set<string>();
	for (const v of views) {
		if (isLastSeenStale(v.beaconLastSeenAtMs, nowMs)) set.add(v.sourceId);
	}
	return set;
};

const probeBeacon = (
	pairs: RelayPair[],
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
) => {
	if (!pairs.length) {
		return { result: Promise.resolve() };
	}

	const epoch = Date.now();

	listenerApi.dispatch(beaconsActions.startLookups({ pairs, epoch }));

	const finishPair = (pair: RelayPair) => {
		listenerApi.dispatch(beaconsActions.finishLookup({ ...pair, epoch }));
	};

	const finishAll = () => {
		for (const pair of pairs) finishPair(pair);
	};

	const CONCURRENCY = 3;
	let i = 0;

	const task = listenerApi.fork(async forkApi => {
		try {
			await Promise.allSettled(
				new Array(CONCURRENCY).fill(0).map(async () => {
					while (i < pairs.length && !listenerApi.signal.aborted) {
						const pair = pairs[i++];

						const res = await forkApi.pause(fetchBeaconDiscovery(pair.lpk, [pair.relay]));

						if (res) {
							listenerApi.dispatch(
								beaconsActions.recordBeacon({
									lpk: pair.lpk,
									relay: pair.relay,
									data: res.data,
									seenAtMs: res.beaconLastSeenAtMs,
								}),
							);
						}
						finishPair(pair);
					}
				})
			);
		} finally {
			finishAll();
		}
	});
	return task;
}

const dropOrphanBeaconNodes = (listenerApi: ListenerEffectAPI<RootState, AppDispatch>) => {
	const state = listenerApi.getState();
	const liveLpks = new Set(selectSourceViews(state).map(v => v.lpk));
	const orphanLpks = beaconNodesSelectors.selectIds(state).filter(
		(lpk) => !liveLpks.has(lpk),
	);
	if (orphanLpks.length) listenerApi.dispatch(beaconsActions.dropLpks({ lpks: orphanLpks }));
};


export const beaconWatcherSpec: ListenerSpec = {
	name: "beaconWatcher",
	listeners: [
		(add) =>
			add({
				predicate: (action, curr, prev) =>
					sourceJustAdded(action, curr, prev),
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload as { sourceId: string };

					const source = selectSourceViewById(listenerApi.getState(), sourceId);
					if (!source) return;

					const task = probeBeacon(
						pairsFromViews([source]),
						listenerApi,
					);

					await task.result;
				}
			}),

		(add) =>
			add({
				predicate: (action, curr, prev) =>
					sourceJustDeleted(action, curr, prev),
				effect: (_action, listenerApi) => {
					dropOrphanBeaconNodes(listenerApi);
				}
			}),

		(add) =>
			add({
				predicate: (action) => {
					return listenerKick.match(action) || (runtimeActions.setAppActiveStatus.match(action) && action.payload.active)
				},
				effect: async (_, listenerApi) => {

					listenerApi.cancelActiveListeners()

					await listenerApi.delay(15);

					dropOrphanBeaconNodes(listenerApi);

					const state = listenerApi.getState();
					const nowMs = Date.now();

					const views = selectSourceViews(state);

					const toProbe = pairsFromViews(
						views.filter(view =>
							view.relays.length
							&& isLastSeenStale(view.beaconLastSeenAtMs, nowMs)
						),
					);

					const task = probeBeacon(toProbe, listenerApi);
					await task.result;
				},
			}),
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {


					const sources = selectSourceViews(listenerApi.getState());

					// warm up sources that may not have registered a nostrClient yet
					await Promise.allSettled(sources.map(s => getNostrClient({ pubkey: s.lpk, relays: s.relays }, s.keys)));

					const unsub = subToBeacons(b => {
						if (listenerApi.signal.aborted) return;

						const { relayUrl, createdByPub: lpk, data, updatedAtUnix } = b;
						const relay = canonicalRelayUrl(relayUrl);
						if (!relay) return;

						listenerApi.dispatch(
							beaconsActions.recordBeacon({
								lpk,
								relay,
								data,
								seenAtMs: updatedAtUnix * 1_000,
							})
						);
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
					const viewsAtStart = selectSourceViews(listenerApi.getState());
					let prevStaleIds = staleSourceIds(viewsAtStart, Date.now());

					const task = listenerApi.fork(async forkApi => {
						try {
							for (; ;) {
								await forkApi.delay(STALE_TICK_MS);
								const state = listenerApi.getState();
								const views = selectSourceViews(state);

								const nowMs = Date.now();

								const currentStaleIds = staleSourceIds(views, nowMs);
								const newlyStaleViews = views.filter(v =>
									v.relays.length
									&& currentStaleIds.has(v.sourceId)
									&& !prevStaleIds.has(v.sourceId)
								);

								if (newlyStaleViews.length && !forkApi.signal.aborted) {
									listenerApi.dispatch(runtimeActions.clockTick({ nowMs }));
									probeBeacon(pairsFromViews(newlyStaleViews), listenerApi);
								}

								prevStaleIds = currentStaleIds;
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
