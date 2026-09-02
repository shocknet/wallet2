import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getNostrClient, subToBeacons, type Client } from "@/Api/nostr";
import {
	fetchBeaconDiscovery,
	type BeaconDiscoveryResult,
	type BeaconUpdate,
} from "@/Api/nostrHandler";
import { createDeferred } from "@/lib/deferred";
import { newLww } from "@/State/sync/lww";
import { identityUnloaded } from "@/State/listeners/actions";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";
import { runtimeActions } from "@/State/runtime/slice";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { canonicalRelayUrl } from "@/State/scoped/beacons/relays";
import { APP_ACTIVE_DEBOUNCE_MS, BEACON_STALE_OLDER_THAN, BEACON_STALE_TICK_MS } from "@/constants";
import { beaconLookupKey, type BeaconsState } from "@/State/scoped/beacons/state";
import { TEST_CLOCK_BY, TEST_RUNTIME_IDENTITY } from "@tests/support/identityFixtures";
import {
	beaconsStateOf,
	createTestBeaconNode,
} from "@tests/support/beaconsFixtures";
import {
	createTestSource,
	createTestSources,
	TEST_RELAY_URL,
	type TestSource,
} from "@tests/support/sourcesHelpers";
import { makeListenerStore } from "@tests/support/listenerStore";
import { beaconWatcherSpec } from "./beaconWatcher";

vi.mock("@/Api/nostrHandler", () => ({
	fetchBeaconDiscovery: vi.fn(),
}));
vi.mock("@/Api/nostr", () => ({
	getNostrClient: vi.fn(),
	subToBeacons: vi.fn(),
}));

const fetchBeaconDiscoveryMock = vi.mocked(fetchBeaconDiscovery);
const getNostrClientMock = vi.mocked(getNostrClient);
const subToBeaconsMock = vi.mocked(subToBeacons);

const NOW_MS = 1_000_000;
const OTHER_RELAY = "wss://other-relay.lightning.pub";
/** Still fresh at kick; newly stale after one ticker interval. */
const TICKER_FRESH_SEEN_AT_MS = NOW_MS - BEACON_STALE_OLDER_THAN + 1;

type BeaconStore = ReturnType<typeof openBeaconStore>;

let emitBeacon: ((update: BeaconUpdate) => void) | null = null;
const unsubBeacons = vi.fn(() => {
	emitBeacon = null;
});

function okDiscovery(over: {
	beaconLastSeenAtMs?: number;
	name?: string;
	avatarUrl?: string;
} = {}): NonNullable<BeaconDiscoveryResult> {
	return {
		beaconLastSeenAtMs: over.beaconLastSeenAtMs ?? NOW_MS,
		data: {
			type: "service",
			name: over.name ?? "node",
			avatarUrl: over.avatarUrl,
		},
	};
}

function delay(ms: number) {
	return new Promise<void>(resolve => {
		setTimeout(resolve, ms);
	});
}

function openBeaconStore(opts: {
	sources?: TestSource[];
	beacons?: BeaconsState;
	loadIdentity?: boolean;
} = {}) {
	const loadIdentity = opts.loadIdentity ?? true;
	const { store } = makeListenerStore({
		specs: [beaconWatcherSpec],
		sources: opts.sources,
		beacons: opts.beacons,
		loadIdentity: false,
	});
	store.dispatch(runtimeActions.clockTick({ nowMs: NOW_MS }));
	if (loadIdentity) {
		store.dispatch(identitiesRegistryActions.setActiveIdentityRuntime({
			identity: TEST_RUNTIME_IDENTITY,
		}));
	}
	return store;
}

function clearCalls() {
	fetchBeaconDiscoveryMock.mockClear();
	getNostrClientMock.mockClear();
	subToBeaconsMock.mockClear();
}

function canonicalRelay(relay = TEST_RELAY_URL) {
	return canonicalRelayUrl(relay) ?? relay;
}

function beaconNode(store: BeaconStore, lpk: string) {
	return store.getState().scoped.beacons.nodes.entities[lpk];
}

function beaconLookup(store: BeaconStore, lpk: string, relay = TEST_RELAY_URL) {
	return store.getState().scoped.beacons.lookups.entities[
		beaconLookupKey(lpk, canonicalRelay(relay))
	];
}

function fireBeacon(update: Partial<BeaconUpdate> & Pick<BeaconUpdate, "createdByPub">) {
	emitBeacon?.({
		updatedAtUnix: NOW_MS / 1_000,
		relayUrl: TEST_RELAY_URL,
		data: { type: "service", name: "live" },
		...update,
	});
}

async function flush() {
	await vi.advanceTimersByTimeAsync(0);
}

async function flushResume() {
	await vi.advanceTimersByTimeAsync(APP_ACTIVE_DEBOUNCE_MS);
}

describe("beaconWatcher", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(NOW_MS);
		emitBeacon = null;
		unsubBeacons.mockReset();
		unsubBeacons.mockImplementation(() => {
			emitBeacon = null;
		});
		getNostrClientMock.mockResolvedValue({} as Client);
		subToBeaconsMock.mockImplementation(cb => {
			emitBeacon = cb;
			return unsubBeacons;
		});
		fetchBeaconDiscoveryMock.mockResolvedValue(okDiscovery());
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("probe on add", () => {
		it("probes a newly added draft source and records the node", async () => {
			const store = openBeaconStore();
			await flush();
			clearCalls();

			const source = createTestSource();
			fetchBeaconDiscoveryMock.mockResolvedValue(okDiscovery({
				beaconLastSeenAtMs: 20_000,
				name: "beacon",
			}));
			store.dispatch(sourcesActions._createDraftDoc({
				sourceId: source.id,
				draft: source.doc,
			}));
			await flush();

			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(source.lpk, [canonicalRelay()]);
			expect(beaconNode(store, source.lpk)).toMatchObject({
				lpk: source.lpk,
				name: "beacon",
				relays: { [canonicalRelay()]: { lastSeenAtMs: 20_000 } },
			});
			expect(beaconLookup(store, source.lpk)?.status).toBe("done");
		});

		it("probes when a remote source is applied", async () => {
			const store = openBeaconStore();
			await flush();
			clearCalls();

			const source = createTestSource();
			fetchBeaconDiscoveryMock.mockResolvedValue(okDiscovery({ name: "remote-node" }));
			store.dispatch(sourcesActions.applyRemoteSource({
				sourceId: source.id,
				remote: source.doc,
			}));
			await flush();

			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			expect(beaconNode(store, source.lpk)?.name).toBe("remote-node");
		});
	});

	describe("kick and resume", () => {
		it("probes once per unique lpk+relay when sources share both", async () => {
			const lpk = createTestSource().lpk;
			const a = createTestSource({ lpk, relays: [TEST_RELAY_URL] });
			const b = createTestSource({ lpk, relays: [TEST_RELAY_URL] });
			openBeaconStore({ sources: [a, b] });
			await flush();

			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(lpk, [canonicalRelay()]);
		});

		it("probes separately when the same lpk uses different relays", async () => {
			const lpk = createTestSource().lpk;
			const onTest = createTestSource({ lpk, relays: [TEST_RELAY_URL] });
			const onOther = createTestSource({ lpk, relays: [OTHER_RELAY] });
			openBeaconStore({ sources: [onTest, onOther] });
			await flush();

			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(2);
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(lpk, [canonicalRelay()]);
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(lpk, [canonicalRelay(OTHER_RELAY)]);
		});

		it("on identity load, probes stale sources and skips fresh ones", async () => {
			const fresh = createTestSource();
			const stale = createTestSource();
			openBeaconStore({
				sources: [fresh, stale],
				beacons: beaconsStateOf({
					nodes: [
						createTestBeaconNode({
							lpk: fresh.lpk,
							name: "fresh",
							relays: { [TEST_RELAY_URL]: { lastSeenAtMs: NOW_MS } },
						}),
						createTestBeaconNode({
							lpk: stale.lpk,
							name: "stale",
							relays: { [TEST_RELAY_URL]: { lastSeenAtMs: 0 } },
						}),
					],
				}),
			});
			await flush();

			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(stale.lpk, [canonicalRelay()]);
		});

		it("skips sources with no relays and deleted sources", async () => {
			const live = createTestSource();
			const noRelays = createTestSource({ relays: [] });
			const deleted = createTestSource({
				doc: { deleted: newLww(true, TEST_CLOCK_BY) },
			});
			openBeaconStore({ sources: [live, noRelays, deleted] });
			await flush();

			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(live.lpk, [canonicalRelay()]);
			expect(getNostrClientMock).toHaveBeenCalledTimes(2);
			expect(getNostrClientMock).toHaveBeenCalledWith(
				{ pubkey: live.lpk, relays: [canonicalRelay()] },
				live.keys,
			);
			expect(getNostrClientMock).toHaveBeenCalledWith(
				{ pubkey: noRelays.lpk, relays: [] },
				noRelays.keys,
			);
		});

		it("drops orphan beacon nodes on kick", async () => {
			const live = createTestSource();
			const orphanLpk = createTestSource().lpk;
			const store = openBeaconStore({
				sources: [live],
				beacons: beaconsStateOf({
					nodes: [
						createTestBeaconNode({
							lpk: live.lpk,
							relays: { [TEST_RELAY_URL]: { lastSeenAtMs: NOW_MS } },
						}),
						createTestBeaconNode({
							lpk: orphanLpk,
							name: "orphan",
							relays: { [TEST_RELAY_URL]: { lastSeenAtMs: NOW_MS } },
						}),
					],
				}),
			});
			await flush();

			expect(beaconNode(store, live.lpk)).toBeDefined();
			expect(beaconNode(store, orphanLpk)).toBeUndefined();
		});

		it("app resume probes remaining stale sources after debounce; inactive does not", async () => {
			const [source] = createTestSources(1);
			fetchBeaconDiscoveryMock.mockResolvedValue(null);
			const store = openBeaconStore({ sources: [source] });
			await flush();
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			clearCalls();

			store.dispatch(runtimeActions.setAppActiveStatus({ active: false }));
			await flushResume();
			expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

			store.dispatch(runtimeActions.setAppActiveStatus({ active: true }));
			await flush();
			expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

			await flushResume();
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(source.lpk, [canonicalRelay()]);
		});

		it("coalesces rapid resumes into one probe", async () => {
			const [source] = createTestSources(1);
			fetchBeaconDiscoveryMock.mockResolvedValue(null);
			const store = openBeaconStore({ sources: [source] });
			await flush();
			clearCalls();

			store.dispatch(runtimeActions.setAppActiveStatus({ active: true }));
			await vi.advanceTimersByTimeAsync(APP_ACTIVE_DEBOUNCE_MS / 2);
			store.dispatch(runtimeActions.setAppActiveStatus({ active: true }));
			await flushResume();

			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("delete", () => {
		it("deleting the last live source of an lpk drops the node", async () => {
			const [source] = createTestSources(1);
			const store = openBeaconStore({ sources: [source] });
			await flush();
			expect(beaconNode(store, source.lpk)).toBeDefined();

			store.dispatch(sourcesActions.markDeleted({
				sourceId: source.id,
				by: TEST_CLOCK_BY,
			}));

			expect(beaconNode(store, source.lpk)).toBeUndefined();
			expect(beaconLookup(store, source.lpk)).toBeUndefined();
		});

		it("deleting one of two sources that share an lpk keeps the node", async () => {
			const lpk = createTestSource().lpk;
			const a = createTestSource({ lpk });
			const b = createTestSource({ lpk });
			const store = openBeaconStore({ sources: [a, b] });
			await flush();
			expect(beaconNode(store, lpk)).toBeDefined();

			store.dispatch(sourcesActions.markDeleted({
				sourceId: a.id,
				by: TEST_CLOCK_BY,
			}));

			expect(beaconNode(store, lpk)).toBeDefined();
		});

		it("a remote tombstone drops the orphan node", async () => {
			const [source] = createTestSources(1);
			const store = openBeaconStore({ sources: [source] });
			await flush();
			expect(beaconNode(store, source.lpk)).toBeDefined();

			store.dispatch(sourcesActions.applyRemoteSource({
				sourceId: source.id,
				remote: {
					...source.doc,
					deleted: { clock: { v: 10, by: TEST_CLOCK_BY }, value: true },
				},
			}));

			expect(beaconNode(store, source.lpk)).toBeUndefined();
		});
	});

	describe("live subscription", () => {
		it("subscribes on kick and records live beacons on the node", async () => {
			const [source] = createTestSources(1);
			fetchBeaconDiscoveryMock.mockResolvedValue(null);
			const store = openBeaconStore({ sources: [source] });
			await flush();

			expect(subToBeaconsMock).toHaveBeenCalledTimes(1);
			fireBeacon({
				createdByPub: source.lpk,
				updatedAtUnix: 2_000,
				data: { type: "service", name: "live" },
			});

			expect(beaconNode(store, source.lpk)).toMatchObject({
				name: "live",
				relays: { [canonicalRelay()]: { lastSeenAtMs: 2_000_000 } },
			});
		});

		it("one live event updates the shared lpk node", async () => {
			const lpk = createTestSource().lpk;
			const a = createTestSource({ lpk });
			const b = createTestSource({ lpk });
			const other = createTestSource();
			fetchBeaconDiscoveryMock.mockResolvedValue(null);
			const store = openBeaconStore({ sources: [a, b, other] });
			await flush();

			fireBeacon({
				createdByPub: lpk,
				updatedAtUnix: 2_000,
				data: { type: "service", name: "shared" },
			});

			expect(beaconNode(store, lpk)?.name).toBe("shared");
			expect(beaconNode(store, lpk)?.relays[canonicalRelay()]?.lastSeenAtMs).toBe(2_000_000);
			expect(beaconNode(store, other.lpk)).toBeUndefined();
		});

		it("ignores live beacons with invalid relay urls", async () => {
			const [source] = createTestSources(1);
			fetchBeaconDiscoveryMock.mockResolvedValue(null);
			const store = openBeaconStore({ sources: [source] });
			await flush();

			fireBeacon({
				createdByPub: source.lpk,
				relayUrl: "not a url",
				data: { type: "service", name: "bad-relay" },
			});

			expect(beaconNode(store, source.lpk)).toBeUndefined();
		});

		it("warms nostr clients for every live source on kick", async () => {
			const live = createTestSources(2);
			const deleted = createTestSource({
				doc: { deleted: newLww(true, TEST_CLOCK_BY) },
			});
			openBeaconStore({ sources: [...live, deleted] });
			await flush();

			expect(getNostrClientMock).toHaveBeenCalledTimes(2);
			expect(getNostrClientMock.mock.calls.map(call => call[0])).toEqual(
				expect.arrayContaining([
					{ pubkey: live[0].lpk, relays: [canonicalRelay()] },
					{ pubkey: live[1].lpk, relays: [canonicalRelay()] },
				]),
			);
		});

		it("unload unsubscribes live beacons", async () => {
			const [source] = createTestSources(1);
			const store = openBeaconStore({ sources: [source] });
			await flush();
			expect(subToBeaconsMock).toHaveBeenCalledTimes(1);

			const unloaded = createDeferred<void>();
			store.dispatch(identityUnloaded({ deferred: unloaded }));
			await unloaded;
			await flush();

			expect(unsubBeacons).toHaveBeenCalledTimes(1);
			expect(emitBeacon).toBeNull();
		});

		it("older live beacon does not overwrite a newer lastSeen", async () => {
			const [source] = createTestSources(1);
			fetchBeaconDiscoveryMock.mockResolvedValue(null);
			const store = openBeaconStore({ sources: [source] });
			await flush();

			fireBeacon({
				createdByPub: source.lpk,
				updatedAtUnix: 2_000,
				data: { type: "service", name: "newer" },
			});
			fireBeacon({
				createdByPub: source.lpk,
				updatedAtUnix: 1_000,
				data: { type: "service", name: "older" },
			});

			expect(beaconNode(store, source.lpk)).toMatchObject({
				name: "newer",
				relays: { [canonicalRelay()]: { lastSeenAtMs: 2_000_000 } },
			});
		});
	});

	describe("stale ticker", () => {
		it("probes a source that just became stale and ticks the clock", async () => {
			const [source] = createTestSources(1);
			const store = openBeaconStore({
				sources: [source],
				beacons: beaconsStateOf({
					nodes: [
						createTestBeaconNode({
							lpk: source.lpk,
							relays: { [TEST_RELAY_URL]: { lastSeenAtMs: TICKER_FRESH_SEEN_AT_MS } },
						}),
					],
				}),
			});
			await flush();
			expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
			clearCalls();

			await vi.advanceTimersByTimeAsync(BEACON_STALE_TICK_MS);

			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(source.lpk, [canonicalRelay()]);
			expect(store.getState().runtime.nowMs).toBe(NOW_MS + BEACON_STALE_TICK_MS);
			expect(beaconNode(store, source.lpk)?.relays[canonicalRelay()]?.lastSeenAtMs).toBe(NOW_MS);
		});

		it("ticker does not re-probe sources that were already stale", async () => {
			const [source] = createTestSources(1);
			fetchBeaconDiscoveryMock.mockResolvedValue(null);
			openBeaconStore({ sources: [source] });
			await flush();
			expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
			clearCalls();

			await vi.advanceTimersByTimeAsync(BEACON_STALE_TICK_MS);

			expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		});
	});

	describe("probe outcomes", () => {
		it("null discovery finishes lookup as done and writes no node", async () => {
			const [source] = createTestSources(1);
			fetchBeaconDiscoveryMock.mockResolvedValue(null);
			const store = openBeaconStore({ sources: [source] });
			await flush();

			expect(beaconNode(store, source.lpk)).toBeUndefined();
			expect(beaconLookup(store, source.lpk)?.status).toBe("done");
		});

		it("does not record a node when identity unloads mid-probe", async () => {
			const [source] = createTestSources(1);
			fetchBeaconDiscoveryMock.mockImplementation(async () => {
				await delay(80);
				return okDiscovery({ name: "too-late" });
			});
			const store = openBeaconStore({ sources: [source] });
			await vi.advanceTimersByTimeAsync(5);

			const unloaded = createDeferred<void>();
			store.dispatch(identityUnloaded({ deferred: unloaded }));
			await unloaded;
			await vi.advanceTimersByTimeAsync(80);

			expect(beaconNode(store, source.lpk)).toBeUndefined();
		});
	});
});
