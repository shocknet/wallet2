import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	combineReducers,
	configureStore,
	createListenerMiddleware,
} from "@reduxjs/toolkit";
import { getNostrClient, subToBeacons, type Client } from "@/Api/nostr";
import {
	fetchBeaconDiscovery,
	type BeaconDiscoveryResult,
	type BeaconUpdate,
} from "@/Api/nostrHandler";
import { APP_ACTIVE_DEBOUNCE_MS, BEACON_STALE_OLDER_THAN } from "@/constants";
import { identityUnloaded } from "@/State/listeners/actions";
import { addIdentityLifecycle } from "@/State/listeners/lifecycle/lifecycle";
import { identitiesRegistryActions, identitiesRegistrySlice } from "@/State/identitiesRegistry/slice";
import { runtimeActions, runTimeReducer } from "@/State/runtime/slice";
import { docsSelectors, sourcesActions, sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { getIntialState } from "@/State/scoped/backups/sources/state";
import type { AppDispatch, RootState } from "@/State/store/store";
import { newLww } from "@/State/sync/lww";
import { createDeferred } from "@/lib/deferred";
import {
	beaconsStateOf,
	createTestBeaconNode,
} from "@tests/support/beaconsFixtures";
import { TEST_CLOCK_BY, TEST_IDENTITY, TEST_RUNTIME_IDENTITY } from "@tests/support/identityFixtures";
import {
	createTestSource,
	createTestSources,
	sourcesStateOf,
	TEST_RELAY_URL,
	type TestSource,
} from "@tests/support/sourcesHelpers";

import { beaconWatcherSpec } from "./beaconWatcher";
import { beaconsSlice } from "./slice";
import { canonicalRelayUrl, canonicalRelayUrls } from "./relays";
import { makeSelectSourceBeaconJoin, type SourceBeaconJoin } from "./selectors";
import {
	beaconRelayStaleAtMs,
	getInitialBeaconsState,
	type BeaconsState,
} from "./state";

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

type BeaconStore = ReturnType<typeof openBeaconStore>;

let emitBeacon: ((update: BeaconUpdate) => void) | null = null;
const unsubBeacons = vi.fn(() => {
	emitBeacon = null;
});

function canonicalRelay(relay = TEST_RELAY_URL) {
	return canonicalRelayUrl(relay) ?? relay;
}

function presentRelays(source: TestSource, extra: string[] = []) {
	const urls = Object.entries(source.doc.relays)
		.filter(([, flag]) => flag.present)
		.map(([url]) => url);
	return canonicalRelayUrls([...urls, ...extra]);
}

function okDiscovery(over: {
	beaconLastSeenAtMs?: number;
	name?: string;
} = {}): NonNullable<BeaconDiscoveryResult> {
	return {
		beaconLastSeenAtMs: over.beaconLastSeenAtMs ?? NOW_MS,
		data: {
			type: "service",
			name: over.name ?? "node",
		},
	};
}

function openBeaconStore(opts: {
	sources?: TestSource[];
	beacons?: BeaconsState;
	loadIdentity?: boolean;
} = {}) {
	const listenerMw = createListenerMiddleware();
	const store = configureStore({
		reducer: {
			identitiesRegistry: identitiesRegistrySlice.reducer,
			runtime: runTimeReducer,
			scoped: combineReducers({
				sources: sourcesSlice.reducer,
				beacons: beaconsSlice.reducer,
			}),
		},
		preloadedState: {
			scoped: {
				sources: opts.sources ? sourcesStateOf(opts.sources) : getIntialState(),
				beacons: opts.beacons ?? getInitialBeaconsState(),
			},
		},
		middleware: gdm =>
			gdm({ serializableCheck: false }).prepend(listenerMw.middleware),
	});

	addIdentityLifecycle(
		listenerMw.startListening.withTypes<RootState, AppDispatch>(),
		[beaconWatcherSpec],
	);
	store.dispatch(identitiesRegistryActions._createNewIdentity({
		identity: TEST_IDENTITY,
	}));
	if (opts.loadIdentity !== false) {
		store.dispatch(identitiesRegistryActions.setActiveIdentityRuntime({
			identity: TEST_RUNTIME_IDENTITY,
		}));
	}
	return store;
}

function relaysInStore(store: BeaconStore, sourceId: string) {
	const relays = docsSelectors.selectById(store.getState() as unknown as RootState, sourceId)?.draft.relays;
	const urls = relays
		? Object.keys(relays).filter(url => relays[url]?.present)
		: [];
	return canonicalRelayUrls(urls);
}

function join(
	store: BeaconStore,
	source: TestSource,
	relays = presentRelays(source),
): SourceBeaconJoin {
	return makeSelectSourceBeaconJoin()(
		store.getState() as unknown as RootState,
		source.lpk,
		relays,
	);
}

function holdJoin(
	store: BeaconStore,
	source: TestSource,
	relays = presentRelays(source),
) {
	const select = makeSelectSourceBeaconJoin();
	return () => select(store.getState() as unknown as RootState, source.lpk, relays);
}

function pendingDiscovery() {
	let resolveDiscovery: (result: BeaconDiscoveryResult) => void = () => {};
	const result = new Promise<BeaconDiscoveryResult>(resolve => {
		resolveDiscovery = resolve;
	});
	return { result, resolve: resolveDiscovery };
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

	it("shows warmingUp until discovery records a fresh beacon", async () => {
		let resolveDiscovery: (result: BeaconDiscoveryResult) => void = () => {};
		fetchBeaconDiscoveryMock.mockImplementation(
			() => new Promise(resolve => {
				resolveDiscovery = resolve;
			}),
		);
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();

		expect(join(store, source)).toMatchObject({
			health: "warmingUp",
			lastSeenAtMs: 0,
		});

		resolveDiscovery(okDiscovery({
			beaconLastSeenAtMs: NOW_MS,
			name: "discovered",
		}));
		await flush();

		expect(join(store, source)).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS,
			name: "discovered",
		});
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			source.lpk,
			[canonicalRelay()],
		);
	});

	it("keeps a fresh persisted beacon fresh and does not probe it", async () => {
		const source = createTestSource();
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "persisted",
			})),
		});
		await flush();

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(join(store, source)).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS,
			name: "persisted",
		});
	});

	it("settles a stale persisted beacon as stale when discovery finds nothing", async () => {
		fetchBeaconDiscoveryMock.mockResolvedValue(null);
		const source = createTestSource();
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: 0,
				name: "old",
			})),
		});
		await flush();

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(join(store, source)).toMatchObject({
			health: "stale",
			lastSeenAtMs: 0,
			name: "old",
		});
	});

	it("treats a source with no relays as stale and does not probe it", async () => {
		const source = createTestSource({ relays: [] });
		const store = openBeaconStore({ sources: [source] });
		await flush();

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(getNostrClientMock).toHaveBeenCalledTimes(1);
		expect(getNostrClientMock).toHaveBeenCalledWith(
			{ pubkey: source.lpk, relays: [] },
			source.doc.keys,
		);
		expect(join(store, source, [])).toMatchObject({
			health: "stale",
			lastSeenAtMs: 0,
		});
	});

	it("records a live beacon on the source join and ignores an older one", async () => {
		fetchBeaconDiscoveryMock.mockResolvedValue(null);
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();
		expect(join(store, source).health).toBe("stale");

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

		expect(join(store, source)).toMatchObject({
			health: "fresh",
			lastSeenAtMs: 2_000_000,
			name: "newer",
		});
	});

	it("ignores a live beacon whose relay url is invalid", async () => {
		fetchBeaconDiscoveryMock.mockResolvedValue(null);
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();

		fireBeacon({
			createdByPub: source.lpk,
			relayUrl: "not a url",
			data: { type: "service", name: "bad-relay" },
		});

		expect(join(store, source)).toMatchObject({
			health: "stale",
			name: undefined,
		});
	});

	it("does not recompute a source join when another source's beacon changes", async () => {
		fetchBeaconDiscoveryMock.mockResolvedValue(null);
		const source = createTestSource();
		const other = createTestSource();
		const store = openBeaconStore({
			sources: [source, other],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "stable",
			})),
		});
		await flush();

		const selectSource = makeSelectSourceBeaconJoin();
		const selectOther = makeSelectSourceBeaconJoin();
		const sourceRelays = presentRelays(source);
		const otherRelays = presentRelays(other);
		const before = selectSource(
			store.getState() as unknown as RootState,
			source.lpk,
			sourceRelays,
		);

		fireBeacon({
			createdByPub: other.lpk,
			data: { type: "service", name: "other" },
		});

		const afterState = store.getState() as unknown as RootState;
		expect(selectSource(afterState, source.lpk, sourceRelays)).toBe(before);
		expect(selectOther(afterState, other.lpk, otherRelays)).toMatchObject({
			health: "fresh",
			name: "other",
		});
	});

	it("moves the join to warmingUp when freshness expires, then fresh when the probe returns", async () => {
		const source = createTestSource();
		const expiresInMs = 1_000;
		const lastSeenAtMs = NOW_MS + expiresInMs - BEACON_STALE_OLDER_THAN - 1;
		expect(beaconRelayStaleAtMs(lastSeenAtMs)).toBe(NOW_MS + expiresInMs);

		let resolveDiscovery: (result: BeaconDiscoveryResult) => void = () => {};
		fetchBeaconDiscoveryMock.mockImplementation(
			() => new Promise(resolve => {
				resolveDiscovery = resolve;
			}),
		);
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs,
				name: "aging",
			})),
		});
		await flush();

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(join(store, source)).toMatchObject({
			health: "fresh",
			name: "aging",
		});

		await vi.advanceTimersByTimeAsync(expiresInMs);

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(join(store, source)).toMatchObject({
			health: "warmingUp",
			name: "aging",
			lastSeenAtMs,
		});

		resolveDiscovery(okDiscovery({
			beaconLastSeenAtMs: NOW_MS + expiresInMs,
			name: "renewed",
		}));
		await flush();

		expect(join(store, source)).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS + expiresInMs,
			name: "renewed",
		});
	});

	it("leaves a finished stale lookup alone until the app resumes", async () => {
		fetchBeaconDiscoveryMock.mockResolvedValue(null);
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();
		expect(join(store, source).health).toBe("stale");
		fetchBeaconDiscoveryMock.mockClear();

		await vi.advanceTimersByTimeAsync(BEACON_STALE_OLDER_THAN);
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

		store.dispatch(runtimeActions.setAppActiveStatus({ active: false }));
		await vi.advanceTimersByTimeAsync(APP_ACTIVE_DEBOUNCE_MS);
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

		store.dispatch(runtimeActions.setAppActiveStatus({ active: true }));
		await flush();
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(APP_ACTIVE_DEBOUNCE_MS);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(join(store, source).health).toBe("stale");
	});

	it("still reprobes a stale source when another beacon arrives during the resume wait", async () => {
		fetchBeaconDiscoveryMock.mockResolvedValue(null);
		const [quiet, speaking] = createTestSources(2);
		const store = openBeaconStore({ sources: [quiet, speaking] });
		await flush();
		expect(join(store, quiet).health).toBe("stale");
		expect(join(store, speaking).health).toBe("stale");
		fetchBeaconDiscoveryMock.mockClear();

		store.dispatch(runtimeActions.setAppActiveStatus({ active: true }));
		await flush();
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

		const earlyMs = 50;
		await vi.advanceTimersByTimeAsync(earlyMs);
		fireBeacon({
			createdByPub: speaking.lpk,
			data: { type: "service", name: "back" },
		});
		await flush();

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(join(store, speaking)).toMatchObject({
			health: "fresh",
			name: "back",
		});

		await vi.advanceTimersByTimeAsync(APP_ACTIVE_DEBOUNCE_MS - earlyMs);

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			quiet.lpk,
			[canonicalRelay()],
		);
		expect(join(store, quiet).health).toBe("stale");
	});

	it("probes a newly added relay and includes it in the source join", async () => {
		const source = createTestSource();
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "original",
			})),
		});
		await flush();
		fetchBeaconDiscoveryMock.mockClear();
		fetchBeaconDiscoveryMock.mockResolvedValue(okDiscovery({
			beaconLastSeenAtMs: NOW_MS + 5_000,
			name: "added-relay",
		}));

		store.dispatch(sourcesActions.setRelayPresence({
			sourceId: source.id,
			relayUrl: OTHER_RELAY,
			present: true,
			by: TEST_CLOCK_BY,
		}));
		await flush();

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			source.lpk,
			[canonicalRelay(OTHER_RELAY)],
		);
		expect(join(store, source, presentRelays(source, [OTHER_RELAY]))).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS + 5_000,
			name: "added-relay",
		});
	});

	it("shares one beacon across sources on the same pair and keeps a different relay separate", async () => {
		const lpk = createTestSource().lpk;
		const a = createTestSource({ lpk, relays: [TEST_RELAY_URL] });
		const b = createTestSource({ lpk, relays: [TEST_RELAY_URL] });
		const otherRelay = createTestSource({ lpk, relays: [OTHER_RELAY] });
		fetchBeaconDiscoveryMock.mockImplementation(async (_lpk, relays) =>
			okDiscovery({
				name: relays[0] === canonicalRelay(OTHER_RELAY) ? "other" : "shared",
			}),
		);
		const store = openBeaconStore({ sources: [a, b, otherRelay] });
		await flush();

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(2);
		expect(join(store, a)).toMatchObject({ health: "fresh", name: "shared" });
		expect(join(store, b)).toMatchObject({ health: "fresh", name: "shared" });
		expect(join(store, otherRelay)).toMatchObject({ health: "fresh", name: "other" });
	});

	it("drops a deleted source's beacon from its join and keeps a shared pair", async () => {
		const lpk = createTestSource().lpk;
		const a = createTestSource({ lpk });
		const b = createTestSource({ lpk });
		const store = openBeaconStore({
			sources: [a, b],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "shared",
			})),
		});
		await flush();
		expect(join(store, a)).toMatchObject({ health: "fresh", name: "shared" });

		store.dispatch(sourcesActions.markDeleted({
			sourceId: a.id,
			by: TEST_CLOCK_BY,
		}));
		await flush();

		expect(join(store, b)).toMatchObject({ health: "fresh", name: "shared" });

		store.dispatch(sourcesActions.markDeleted({
			sourceId: b.id,
			by: TEST_CLOCK_BY,
		}));
		await flush();

		expect(join(store, b)).toMatchObject({
			health: "warmingUp",
			lastSeenAtMs: 0,
			name: undefined,
		});
	});

	it("drops a remote tombstone's beacon from the join", async () => {
		const source = createTestSource();
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "going",
			})),
		});
		await flush();

		store.dispatch(sourcesActions.applyRemoteSource({
			sourceId: source.id,
			remote: {
				...source.doc,
				deleted: { clock: { v: 10, by: TEST_CLOCK_BY }, value: true },
			},
		}));
		await flush();

		expect(join(store, source)).toMatchObject({
			health: "warmingUp",
			lastSeenAtMs: 0,
			name: undefined,
		});
	});

	it("warms a nostr client for every live source and unsubscribes on unload", async () => {
		const live = createTestSources(2);
		const deleted = createTestSource({
			doc: { deleted: newLww(true, TEST_CLOCK_BY) },
		});
		const store = openBeaconStore({ sources: [...live, deleted] });
		await flush();

		expect(getNostrClientMock).toHaveBeenCalledTimes(2);
		expect(subToBeaconsMock).toHaveBeenCalledTimes(1);
		expect(join(store, live[0]).health).toBe("fresh");
		expect(join(store, live[1]).health).toBe("fresh");

		const unloaded = createDeferred<void>();
		store.dispatch(identityUnloaded({ deferred: unloaded }));
		await unloaded;
		await flush();

		expect(unsubBeacons).toHaveBeenCalledTimes(1);
		expect(emitBeacon).toBeNull();
	});

	it("does nothing until the identity is loaded", async () => {
		const source = createTestSource();
		const store = openBeaconStore({
			sources: [source],
			loadIdentity: false,
		});
		await flush();

		expect(getNostrClientMock).not.toHaveBeenCalled();
		expect(subToBeaconsMock).not.toHaveBeenCalled();
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(join(store, source)).toMatchObject({
			health: "warmingUp",
			lastSeenAtMs: 0,
		});
	});

	it("probes one canonical pair when the source lists the same relay twice", async () => {
		const source = createTestSource({
			relays: [TEST_RELAY_URL, `${TEST_RELAY_URL}/`],
		});
		const store = openBeaconStore({ sources: [source] });
		await flush();

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			source.lpk,
			[canonicalRelay()],
		);
		expect(join(store, source)).toMatchObject({
			health: "fresh",
			name: "node",
		});
	});

	it("ignores an invalid relay and probes the valid one", async () => {
		const source = createTestSource({
			relays: ["not a url", TEST_RELAY_URL],
		});
		const store = openBeaconStore({ sources: [source] });
		await flush();

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			source.lpk,
			[canonicalRelay()],
		);
		expect(join(store, source)).toMatchObject({ health: "fresh" });
	});

	it("shows the newest observation's metadata on the join", async () => {
		const source = createTestSource({
			relays: [TEST_RELAY_URL, OTHER_RELAY],
		});
		const fees = { serviceFeeBps: 50, serviceFeeFloor: 1 };
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(
				createTestBeaconNode({
					lpk: source.lpk,
					relay: TEST_RELAY_URL,
					lastSeenAtMs: NOW_MS - 5_000,
					name: "older",
					avatarUrl: "https://older.example/a.png",
				}),
				createTestBeaconNode({
					lpk: source.lpk,
					relay: OTHER_RELAY,
					lastSeenAtMs: NOW_MS,
					name: "newer",
					avatarUrl: "https://newer.example/a.png",
					fees,
					nextRelay: "wss://next.example",
				}),
			),
		});
		await flush();

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(join(store, source)).toEqual({
			health: "fresh",
			lastSeenAtMs: NOW_MS,
			name: "newer",
			avatarUrl: "https://newer.example/a.png",
			fees,
			nextRelay: "wss://next.example",
		});
	});

	it("keeps the join fresh while an older relay is probing", async () => {
		const older = pendingDiscovery();
		fetchBeaconDiscoveryMock.mockImplementation((_lpk, relays) => {
			if (relays[0] === canonicalRelay(OTHER_RELAY)) return older.result;
			return Promise.resolve(okDiscovery({ name: "should-not-run" }));
		});
		const source = createTestSource({
			relays: [TEST_RELAY_URL, OTHER_RELAY],
		});
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "kept",
				avatarUrl: "https://kept.example/a.png",
			})),
		});
		await flush();

		const read = holdJoin(store, source);
		const before = read();
		expect(before).toMatchObject({
			health: "fresh",
			name: "kept",
			avatarUrl: "https://kept.example/a.png",
		});
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			source.lpk,
			[canonicalRelay(OTHER_RELAY)],
		);

		older.resolve(null);
		await flush();

		expect(read()).toBe(before);
	});

	it("lets a live beacon win over an in-flight probe", async () => {
		const discovery = pendingDiscovery();
		fetchBeaconDiscoveryMock.mockImplementation(() => discovery.result);
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();
		expect(join(store, source).health).toBe("warmingUp");

		fireBeacon({
			createdByPub: source.lpk,
			data: { type: "service", name: "live" },
		});
		expect(join(store, source)).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS,
			name: "live",
		});

		discovery.resolve(okDiscovery({
			beaconLastSeenAtMs: NOW_MS - 5_000,
			name: "probe",
		}));
		await flush();

		expect(join(store, source)).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS,
			name: "live",
		});
	});

	it("keeps the same join when a duplicate live beacon arrives", async () => {
		fetchBeaconDiscoveryMock.mockResolvedValue(null);
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();

		fireBeacon({
			createdByPub: source.lpk,
			data: { type: "service", name: "live" },
		});
		await flush();
		fetchBeaconDiscoveryMock.mockClear();

		const read = holdJoin(store, source);
		const before = read();
		fireBeacon({
			createdByPub: source.lpk,
			data: { type: "service", name: "live" },
		});
		await flush();

		expect(read()).toBe(before);
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
	});

	it("settles a thrown probe as stale and retries it only on resume", async () => {
		fetchBeaconDiscoveryMock.mockRejectedValue(new Error("down"));
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();

		expect(join(store, source)).toMatchObject({
			health: "stale",
			lastSeenAtMs: 0,
		});
		fetchBeaconDiscoveryMock.mockClear();

		await vi.advanceTimersByTimeAsync(BEACON_STALE_OLDER_THAN);
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

		store.dispatch(runtimeActions.setAppActiveStatus({ active: true }));
		await vi.advanceTimersByTimeAsync(APP_ACTIVE_DEBOUNCE_MS);

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(join(store, source).health).toBe("stale");
	});

	it("does not reprobe a fresh beacon when the app resumes", async () => {
		const source = createTestSource();
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "still-fresh",
			})),
		});
		await flush();
		fetchBeaconDiscoveryMock.mockClear();

		store.dispatch(runtimeActions.setAppActiveStatus({ active: false }));
		store.dispatch(runtimeActions.setAppActiveStatus({ active: true }));
		await vi.advanceTimersByTimeAsync(APP_ACTIVE_DEBOUNCE_MS);

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(join(store, source)).toMatchObject({
			health: "fresh",
			name: "still-fresh",
		});
	});

	it("probes only the relay that just expired and keeps the join fresh", async () => {
		const soonInMs = 1_000;
		const laterInMs = 5_000;
		const soonSeenAtMs = NOW_MS + soonInMs - BEACON_STALE_OLDER_THAN - 1;
		const laterSeenAtMs = NOW_MS + laterInMs - BEACON_STALE_OLDER_THAN - 1;
		const soon = pendingDiscovery();
		const later = pendingDiscovery();
		fetchBeaconDiscoveryMock.mockImplementation((_lpk, relays) =>
			relays[0] === canonicalRelay() ? soon.result : later.result,
		);
		const source = createTestSource({
			relays: [TEST_RELAY_URL, OTHER_RELAY],
		});
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(
				createTestBeaconNode({
					lpk: source.lpk,
					relay: TEST_RELAY_URL,
					lastSeenAtMs: soonSeenAtMs,
					name: "soon",
				}),
				createTestBeaconNode({
					lpk: source.lpk,
					relay: OTHER_RELAY,
					lastSeenAtMs: laterSeenAtMs,
					name: "later",
				}),
			),
		});
		await flush();
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

		const read = holdJoin(store, source);
		const before = read();
		expect(before).toMatchObject({
			health: "fresh",
			lastSeenAtMs: laterSeenAtMs,
			name: "later",
		});

		await vi.advanceTimersByTimeAsync(soonInMs);

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			source.lpk,
			[canonicalRelay()],
		);
		expect(read()).toBe(before);

		soon.resolve(null);
		await flush();
		expect(read()).toBe(before);

		await vi.advanceTimersByTimeAsync(laterInMs - soonInMs);

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(2);
		expect(read()).toMatchObject({
			health: "warmingUp",
			lastSeenAtMs: laterSeenAtMs,
			name: "later",
		});

		later.resolve(okDiscovery({
			beaconLastSeenAtMs: NOW_MS + laterInMs,
			name: "renewed",
		}));
		await flush();
		expect(read()).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS + laterInMs,
			name: "renewed",
		});
	});

	it("restarts expiry after a live beacon brings a stale source back", async () => {
		fetchBeaconDiscoveryMock.mockResolvedValue(null);
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();
		expect(join(store, source).health).toBe("stale");
		fetchBeaconDiscoveryMock.mockClear();

		const discovery = pendingDiscovery();
		fetchBeaconDiscoveryMock.mockImplementation(() => discovery.result);
		fireBeacon({
			createdByPub: source.lpk,
			data: { type: "service", name: "revived" },
		});
		await flush();
		expect(join(store, source)).toMatchObject({
			health: "fresh",
			name: "revived",
		});
		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(BEACON_STALE_OLDER_THAN + 1);

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(join(store, source)).toMatchObject({
			health: "warmingUp",
			name: "revived",
		});
	});

	it("finishes a probe that was already running when the scheduler restarts", async () => {
		const first = pendingDiscovery();
		fetchBeaconDiscoveryMock.mockImplementation((_lpk, relays) => {
			if (relays[0] === canonicalRelay()) return first.result;
			return Promise.resolve(okDiscovery({
				beaconLastSeenAtMs: NOW_MS + 1_000,
				name: "added",
			}));
		});
		const source = createTestSource();
		const store = openBeaconStore({ sources: [source] });
		await flush();
		expect(join(store, source).health).toBe("warmingUp");

		store.dispatch(sourcesActions.setRelayPresence({
			sourceId: source.id,
			relayUrl: OTHER_RELAY,
			present: true,
			by: TEST_CLOCK_BY,
		}));
		await flush();

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(2);
		expect(join(store, source, relaysInStore(store, source.id))).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS + 1_000,
			name: "added",
		});

		first.resolve(okDiscovery({
			beaconLastSeenAtMs: NOW_MS + 5_000,
			name: "original",
		}));
		await flush();

		expect(join(store, source, relaysInStore(store, source.id))).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS + 5_000,
			name: "original",
		});
	});

	it("probes at most three relays at once", async () => {
		const relays = [
			"wss://a.example",
			"wss://b.example",
			"wss://c.example",
			"wss://d.example",
		];
		const pending = new Map<string, (result: BeaconDiscoveryResult) => void>();
		fetchBeaconDiscoveryMock.mockImplementation(
			(_lpk, requested: string[]) => new Promise(resolve => {
				pending.set(requested[0], resolve);
			}),
		);
		const source = createTestSource({ relays });
		const store = openBeaconStore({ sources: [source] });
		await flush();

		expect(pending.size).toBe(3);
		expect(join(store, source).health).toBe("warmingUp");

		const [firstRelay, resolveFirst] = [...pending.entries()][0];
		resolveFirst(okDiscovery({ name: firstRelay }));
		await flush();

		expect(pending.size).toBe(4);
		for (const [relay, resolve] of pending) {
			resolve(okDiscovery({
				beaconLastSeenAtMs: NOW_MS + relay.charCodeAt(6),
				name: relay,
			}));
		}
		await flush();

		expect(join(store, source)).toMatchObject({
			health: "fresh",
			name: "wss://d.example",
		});
	});

	it("does not probe when relay presence is set to the value it already has", async () => {
		const source = createTestSource();
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "steady",
			})),
		});
		await flush();
		fetchBeaconDiscoveryMock.mockClear();
		const read = holdJoin(store, source);
		const before = read();

		store.dispatch(sourcesActions.setRelayPresence({
			sourceId: source.id,
			relayUrl: TEST_RELAY_URL,
			present: true,
			by: TEST_CLOCK_BY,
		}));
		await flush();

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(read()).toBe(before);
	});

	it("drops a relay that no live source still uses", async () => {
		const lpk = createTestSource().lpk;
		const shared = createTestSource({
			lpk,
			relays: [TEST_RELAY_URL, OTHER_RELAY],
		});
		const other = createTestSource({
			lpk,
			relays: [TEST_RELAY_URL],
		});
		const store = openBeaconStore({
			sources: [shared, other],
			beacons: beaconsStateOf(
				createTestBeaconNode({
					lpk,
					relay: TEST_RELAY_URL,
					lastSeenAtMs: NOW_MS,
					name: "shared",
				}),
				createTestBeaconNode({
					lpk,
					relay: OTHER_RELAY,
					lastSeenAtMs: NOW_MS,
					name: "extra",
				}),
			),
		});
		await flush();
		fetchBeaconDiscoveryMock.mockClear();

		store.dispatch(sourcesActions.setRelayPresence({
			sourceId: shared.id,
			relayUrl: OTHER_RELAY,
			present: false,
			by: TEST_CLOCK_BY,
		}));
		await flush();

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(join(store, shared, relaysInStore(store, shared.id))).toMatchObject({
			health: "fresh",
			name: "shared",
		});
		expect(join(store, other)).toMatchObject({
			health: "fresh",
			name: "shared",
		});
		expect(join(store, shared, [canonicalRelay(OTHER_RELAY)])).toMatchObject({
			health: "warmingUp",
			lastSeenAtMs: 0,
			name: undefined,
		});
	});

	it("probes a relay added by a remote source and ignores a clock-only merge", async () => {
		const source = createTestSource();
		const store = openBeaconStore({
			sources: [source],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: source.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "local",
			})),
		});
		await flush();
		fetchBeaconDiscoveryMock.mockClear();
		const read = holdJoin(store, source);
		const before = read();

		store.dispatch(sourcesActions.applyRemoteSource({
			sourceId: source.id,
			remote: {
				...source.doc,
				label: { clock: { v: 5, by: TEST_CLOCK_BY }, value: "renamed" },
			},
		}));
		await flush();

		expect(fetchBeaconDiscoveryMock).not.toHaveBeenCalled();
		expect(read()).toBe(before);

		fetchBeaconDiscoveryMock.mockResolvedValue(okDiscovery({
			beaconLastSeenAtMs: NOW_MS + 4_000,
			name: "from-remote",
		}));
		store.dispatch(sourcesActions.applyRemoteSource({
			sourceId: source.id,
			remote: {
				...source.doc,
				relays: {
					...source.doc.relays,
					[OTHER_RELAY]: { clock: { v: 1, by: TEST_CLOCK_BY }, present: true },
				},
			},
		}));
		await flush();

		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			source.lpk,
			[canonicalRelay(OTHER_RELAY)],
		);
		expect(join(store, source, relaysInStore(store, source.id))).toMatchObject({
			health: "fresh",
			lastSeenAtMs: NOW_MS + 4_000,
			name: "from-remote",
		});
	});

	it("probes a source added after kick without opening another nostr client", async () => {
		const first = createTestSource();
		const store = openBeaconStore({
			sources: [first],
			beacons: beaconsStateOf(createTestBeaconNode({
				lpk: first.lpk,
				relay: TEST_RELAY_URL,
				lastSeenAtMs: NOW_MS,
				name: "already",
			})),
		});
		await flush();
		getNostrClientMock.mockClear();
		fetchBeaconDiscoveryMock.mockClear();

		const added = createTestSource();
		store.dispatch(sourcesActions._createDraftDoc({
			sourceId: added.id,
			draft: added.doc,
		}));
		await flush();

		expect(getNostrClientMock).not.toHaveBeenCalled();
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledTimes(1);
		expect(fetchBeaconDiscoveryMock).toHaveBeenCalledWith(
			added.lpk,
			[canonicalRelay()],
		);
		expect(join(store, added)).toMatchObject({
			health: "fresh",
			name: "node",
		});
		expect(join(store, first)).toMatchObject({
			health: "fresh",
			name: "already",
		});
	});
});
