import {
	createAction,
	TaskAbortError,
	UnknownAction,
	type ListenerEffectAPI,
} from "@reduxjs/toolkit";

import { listenerKick } from "@/State/listeners/actions";
import type { ListenerSpec } from "../../listeners/lifecycle/lifecycle";

import { getNostrClient, subToBeacons } from "@/Api/nostr";
import { fetchBeaconDiscovery } from "@/Api/nostrHandler";
import logger from "@/Api/helpers/logger";

import { APP_ACTIVE_DEBOUNCE_MS } from "@/constants";
import { runtimeActions } from "@/State/runtime/slice";
import type { AppDispatch, RootState } from "@/State/store/store";

import { docsSelectors } from "@/State/scoped/backups/sources/slice";
import type { SourceDocV0 } from "@/State/scoped/backups/sources/schema";
import type { NostrKeyPair } from "@/lib/regex";

import {
	beaconsActions,
	beaconRelayNodesSelectors,
	type BeaconLookupCandidate,
} from "@/State/scoped/beacons/slice";

import {
	beaconRelayNodeKey,
	beaconRelayStaleAtMs,
	isBeaconRelayFreshAt,
} from "@/State/scoped/beacons/state";

import {
	canonicalRelayUrl,
	canonicalRelayUrls,
} from "@/State/scoped/beacons/relays";

import {
	isSourceRelaysChanged,
	sourceJustAdded,
	sourceJustDeleted,
} from "../../listeners/predicates";


type BeaconSourceTarget = {
	lpk: string;
	relays: string[];
	keys: NostrKeyPair;
};

type BeaconRelayTarget = {
	id: string;
	lpk: string;
	relay: string;
};


const presentRelayUrls = (relays?: Record<string, { present: boolean }>) =>
	relays ? Object.keys(relays).filter(url => relays[url]?.present) : [];

const sourceRelays = (doc: SourceDocV0) =>
	canonicalRelayUrls(presentRelayUrls(doc.relays));


const getBeaconSourceTargets = (state: RootState): BeaconSourceTarget[] =>
	docsSelectors
		.selectAll(state)
		.filter(entity => !entity.draft.deleted.value)
		.map(entity => ({
			lpk: entity.draft.lpk,
			relays: sourceRelays(entity.draft),
			keys: entity.draft.keys,
		}));

const warmNostrClients = async (sources: readonly BeaconSourceTarget[]) => {
	await Promise.allSettled(
		sources.map(source =>
			getNostrClient(
				{ pubkey: source.lpk, relays: source.relays },
				source.keys,
			),
		),
	);
};


const relayTargetsFromSources = (
	sources: readonly BeaconSourceTarget[],
): BeaconRelayTarget[] => {
	const byId = new Map<string, BeaconRelayTarget>();

	for (const source of sources) {
		for (const relay of source.relays) {
			const id = beaconRelayNodeKey(source.lpk, relay);
			byId.set(id, { id, lpk: source.lpk, relay });
		}
	}

	return [...byId.values()];
};


const dropOrphanBeaconNodes = (
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
	targets: readonly BeaconRelayTarget[],
) => {
	const state = listenerApi.getState();
	const activeIds = new Set(targets.map(target => target.id));
	const orphanIds = beaconRelayNodesSelectors
		.selectIds(state)
		.filter(id => !activeIds.has(id));

	if (orphanIds.length) {
		listenerApi.dispatch(beaconsActions.dropIds({ ids: orphanIds }));
	}
};


let nextLookupEpoch = 1;


const startProbes = (
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
	targets: readonly BeaconRelayTarget[],
	reprobeDone = false,
) => {
	const state = listenerApi.getState();
	const nowMs = Date.now();
	const pairs: BeaconLookupCandidate[] = [];

	for (const target of targets) {
		const node = beaconRelayNodesSelectors.selectById(state, target.id);

		const fresh =
			node?.lastSeenAtMs !== undefined &&
			isBeaconRelayFreshAt(node.lastSeenAtMs, nowMs);

		if (fresh) continue;
		if (node?.lookup?.status === "probing") continue;
		if (node?.lookup?.status === "done" && !reprobeDone) continue;

		pairs.push({
			id: target.id,
			lpk: target.lpk,
			relay: target.relay,
			expectedLastSeenAtMs: node?.lastSeenAtMs ?? null,
		});
	}

	if (!pairs.length) return;

	listenerApi.dispatch(
		beaconsActions.startLookups({
			pairs,
			epoch: nextLookupEpoch++,
		}),
	);
};


const reconcileBeaconTargets = (
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
	reprobeDone = false,
): BeaconRelayTarget[] => {
	const sources = getBeaconSourceTargets(listenerApi.getState());
	const targets = relayTargetsFromSources(sources);

	dropOrphanBeaconNodes(listenerApi, targets);
	startProbes(listenerApi, targets, reprobeDone);

	return targets;
};


const findNextExpiryAtMs = (
	state: RootState,
	targets: readonly BeaconRelayTarget[],
): number | null => {
	const nowMs = Date.now();
	let next: number | null = null;

	for (const target of targets) {
		const node = beaconRelayNodesSelectors.selectById(state, target.id);

		if (node?.lastSeenAtMs === undefined) continue;
		if (!isBeaconRelayFreshAt(node.lastSeenAtMs, nowMs)) continue;

		const staleAtMs = beaconRelayStaleAtMs(node.lastSeenAtMs);

		if (next === null || staleAtMs < next) {
			next = staleAtMs;
		}
	}

	return next;
};


const isAppResume = (action: unknown) =>
	runtimeActions.setAppActiveStatus.match(action) &&
	action.payload.active;


const reprobeStaleBeacons = createAction("@@beacons/reprobeStale");


/*
 * recordBeacon is already a specific action, but we can be slightly more
 * precise and only reschedule when it actually changed this exact pair.
 *
 * That avoids restarting the scheduler for an ignored old/duplicate beacon.
 */
const didRecordBeaconChangeState = (
	action: unknown,
	curr: RootState,
	prev: RootState,
) => {
	if (!beaconsActions.recordBeacon.match(action)) return false;

	const relay = canonicalRelayUrl(action.payload.relay);
	if (!relay) return false;

	const id = beaconRelayNodeKey(action.payload.lpk, relay);

	return beaconRelayNodesSelectors.selectById(curr, id) !==
		beaconRelayNodesSelectors.selectById(prev, id);
};



const shouldRunExpiryScheduler = (
	action: UnknownAction,
	curr: RootState,
	prev: RootState,
) => {
	if (listenerKick.match(action)) return true;
	if (reprobeStaleBeacons.match(action)) return true;

	if (
		sourceJustAdded(action, curr, prev) ||
		sourceJustDeleted(action, curr, prev) ||
		isSourceRelaysChanged(action, curr, prev)
	) {
		return true;
	}

	return didRecordBeaconChangeState(action, curr, prev);
};


export const beaconWatcherSpec: ListenerSpec = {
	name: "beaconWatcher",

	listeners: [
		/*
		 * Open a Nostr client for every live source.
		 */
		add =>
			add({
				actionCreator: listenerKick,

				effect: async (_action, listenerApi) => {
					await warmNostrClients(
						getBeaconSourceTargets(listenerApi.getState()),
					);
				},
			}),


		add =>
			add({
				actionCreator: listenerKick,

				effect: async (_action, listenerApi) => {
					const unsub = subToBeacons(beacon => {
						if (listenerApi.signal.aborted) return;

						const relay = canonicalRelayUrl(beacon.relayUrl);
						if (!relay) return;

						listenerApi.dispatch(
							beaconsActions.recordBeacon({
								lpk: beacon.createdByPub,
								relay,
								seenAtMs: beacon.updatedAtUnix * 1_000,
								observedAtMs: Date.now(),
								data: beacon.data,
							}),
						);
					});

					try {
						await listenerApi.take(() => false);
					} finally {
						try {
							unsub();
						} catch {
							// no-op
						}
					}
				},
			}),



		add =>
			add({
				actionCreator: beaconsActions.startLookups,

				effect: async (action, listenerApi) => {
					const { pairs, epoch } = action.payload;
					const state = listenerApi.getState();

					/*
					 * startLookups can reject a candidate if a newer beacon
					 * arrived between reconciliation and reducer execution.
					 */
					const accepted = pairs.filter(pair => {
						const node = beaconRelayNodesSelectors.selectById(
							state,
							pair.id,
						);

						return (
							node?.lookup?.status === "probing" &&
							node.lookup.epoch === epoch
						);
					});

					const CONCURRENCY = 3;
					let index = 0;

					const task = listenerApi.fork(async forkApi => {
						await Promise.all(
							new Array(CONCURRENCY).fill(0).map(async () => {
								while (
									index < accepted.length &&
									!forkApi.signal.aborted
								) {
									const pair = accepted[index++];

									try {
										const result = await forkApi.pause(
											fetchBeaconDiscovery(pair.lpk, [pair.relay]),
										);

										if (result) {
											listenerApi.dispatch(
												beaconsActions.recordBeacon({
													lpk: pair.lpk,
													relay: pair.relay,
													seenAtMs:
														result.beaconLastSeenAtMs,
													observedAtMs: Date.now(),
													data: result.data,
												}),
											);
										}
									} catch (err) {
										if (
											err instanceof TaskAbortError ||
											forkApi.signal.aborted
										) {
											return;
										}

										if (err instanceof Error) {
											logger.error(`[${beaconWatcherSpec.name}] probe ${pair.id}: ${err.message}`);
										}
									}

									listenerApi.dispatch(
										beaconsActions.finishLookup({
											id: pair.id,
											epoch,
										}),
									);
								}
							}),
						);
					});

					await task.result;
				},
			}),


		/*
		 * On resume, retry lookups that already finished stale, after a short wait to debounce repeated resumes
		 */
		add =>
			add({
				predicate: action => isAppResume(action),

				effect: async (_action, listenerApi) => {
					listenerApi.cancelActiveListeners();

					try {
						await listenerApi.delay(APP_ACTIVE_DEBOUNCE_MS);
						listenerApi.dispatch(reprobeStaleBeacons());
					} catch (err) {
						if (err instanceof TaskAbortError) return;

						if (err instanceof Error) {
							logger.error(
								`[${beaconWatcherSpec.name}] resume reprobe error: ${err.message}`,
							);
						}
					}
				},
			}),


		/*
		 * Scheduler for beacon freshness expiry.
		 * Sleeps until the earliest next expiray.
		 */
		add =>
			add({
				predicate: shouldRunExpiryScheduler,

				effect: async (action, listenerApi) => {
					listenerApi.cancelActiveListeners();

					try {
						let reprobeDone = reprobeStaleBeacons.match(action);

						for (; ;) {
							const targets = reconcileBeaconTargets(
								listenerApi,
								reprobeDone,
							);

							reprobeDone = false;

							const nextExpiryAtMs = findNextExpiryAtMs(
								listenerApi.getState(),
								targets,
							);

							/*
							 * No fresh observations means there is no future
							 * time boundary to wait for.
							 *
							 * A later explicit trigger (source change, new
							 * beacon, resume, etc.) starts a new scheduler.
							 */
							if (nextExpiryAtMs === null) return;

							const delayMs = Math.max(
								1,
								nextExpiryAtMs - Date.now(),
							);

							await listenerApi.delay(delayMs);
						}
					} catch (err) {
						if (err instanceof TaskAbortError) return;

						if (err instanceof Error) {
							logger.error(
								`[${beaconWatcherSpec.name}] scheduler error: ${err.message}`,
							);
						}
					}
				},
			}),
	],
};
