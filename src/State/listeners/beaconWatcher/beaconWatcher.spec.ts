import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { sourcesActions, sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { identityLoaded } from "../actions";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import { BeaconUpdate } from "@/Api/nostrHandler";
import { createTestSourceDoc, generateSources, getPreloadedSourcesState, TEST_RELAY_URL } from "@tests/support/sourcesHelpers";
import { beaconWatcherSpec } from "./beaconWatcher";
import { fetchBeaconDiscovery } from "@/helpers/remoteBackups";
import { addIdentityLifecycle } from "../lifecycle/lifecycle";
import { BEACON_STALE_OLDER_THAN, SourcesState } from "@/State/scoped/backups/sources/state";
import { getAllNostrClients, getNostrClient, NostrClient, subToBeacons } from "@/Api/nostr";


let __emitBeacon: ((b: BeaconUpdate) => void) | null = null;

vi.mock("@/helpers/remoteBackups", () => ({
	fetchBeaconDiscovery: vi.fn(),
}));


vi.mock("@/Api/nostr", () => ({
	getAllNostrClients: vi.fn(),
	getNostrClient: vi.fn().mockResolvedValue(undefined),
	subToBeacons: vi.fn((cb: typeof __emitBeacon) => {
		__emitBeacon = cb;
		return () => { __emitBeacon = null; };
	}),
}));

const fetchBeaconDiscoveryMock = vi.mocked(fetchBeaconDiscovery);
const getAllNostrClientsMock = vi.mocked(getAllNostrClients);


const identity: Identity = {
	type: IdentityType.LOCAL_KEY,
	label: "label",
	createdAt: Date.now(),
	pubkey: "hexhexhex",
	privkey: "hexhexhex",
	relays: ["wss://example.com"]
}






const makeStore = (initialState?: SourcesState) => {



	const listenerMw = createListenerMiddleware();

	const store = configureStore({
		reducer: {
			scoped: combineReducers({
				sources: sourcesSlice.reducer,
			}),
		},
		preloadedState: initialState ?
			{
				scoped: {
					sources: initialState
				}
			} : undefined
		,
		middleware: gdm =>
			gdm().prepend(listenerMw.middleware),
	});

	type AppStore = typeof store;
	type RootState = ReturnType<AppStore["getState"]>;
	type AppDispatch = AppStore["dispatch"];

	const startAppListening = listenerMw.startListening.withTypes<
		RootState,
		AppDispatch
	>();

	// @ts-expect-error nevermind not the full store, just sources slice
	addIdentityLifecycle(startAppListening, [beaconWatcherSpec]);



	return store;

}

let store = makeStore();
describe("beaconWatcher", () => {

	beforeEach(() => {
		vi.useFakeTimers();
		vi.resetAllMocks();

	});
	afterEach(() => {
		vi.useRealTimers();
	});


	describe("fetching beacon for new source actions", () => {
		it("fetches beacon for a newly added source and updates lastSeenAtMs", async () => {
			store = makeStore();
			store.dispatch(identityLoaded({ identity }));


			fetchBeaconDiscoveryMock.mockResolvedValue({
				beaconLastSeenAtMs: 20_000,
				name: "beacon",
			});

			const [source] = generateSources(1);
			store.dispatch(sourcesActions._createDraftDoc({ sourceId: source.id, draft: createTestSourceDoc(source.lpk, source.id) }));
			let state = store.getState().scoped.sources;
			expect(state.metadata.entities[source.id].lastSeenAtMs).toBe(0);


			await vi.waitFor(() => {
				state = store.getState().scoped.sources;
				if (state.metadata.entities[source.id].lastSeenAtMs === 0) throw new Error
			})


			state = store.getState().scoped.sources;
			expect(state.metadata.entities[source.id].lastSeenAtMs).toBe(20_000);
		});

	});

	describe("sub to beacons", () => {
		it("listens for beacon nostr events and updates lastSeenAtMs for all source of that lpk", async () => {
			const sources = generateSources(3);
			const knownLpkSources = generateSources(3, "known-lpk-source", "knownlpk");
			const initialState = getPreloadedSourcesState([...sources, ...knownLpkSources]);
			store = makeStore(initialState);

			store.dispatch(identityLoaded({ identity }));


			await vi.waitFor(() => {
				if (vi.mocked(subToBeacons).mock.calls.length === 0) throw new Error
			})

			for (const src of sources) {
				__emitBeacon?.({ createdByPub: src.lpk, name: "beacon", updatedAtUnix: 1_000, relayUrl: TEST_RELAY_URL });
			}

			// one emit should update all sources of lpk "knownlpk"
			__emitBeacon?.({ createdByPub: knownLpkSources[0].lpk, name: "known-lpk-beacon", updatedAtUnix: 2_000, relayUrl: TEST_RELAY_URL });

			await vi.waitFor(() => {
				if (vi.mocked(getNostrClient).mock.calls.length !== 6) throw new Error
			})




			for (const src of sources) {
				expect(store.getState().scoped!.sources.metadata.entities[src.id].lastSeenAtMs).toBe(1_000 * 1_000);
				expect(store.getState().scoped!.sources.metadata.entities[src.id].beaconName).toBe("beacon");
			}


			for (const src of knownLpkSources) {
				expect(store.getState().scoped!.sources.metadata.entities[src.id].lastSeenAtMs).toBe(2_000 * 1000);
				expect(store.getState().scoped!.sources.metadata.entities[src.id].beaconName).toBe("known-lpk-beacon");
			}
		});
	});

	describe("disconnecting nostr clients", () => {
		it("disconnects a source's nostr client when it becomes stale", async () => {
			const sources = generateSources(3);
			const initialState = getPreloadedSourcesState(sources);
			store = makeStore(initialState);

			const artificalNowMs = 1_000_000;
			vi.setSystemTime(artificalNowMs);


			const disconnectCallsSpy = vi.fn();
			getAllNostrClientsMock.mockReturnValue(
				sources.map(s => ({ pubDestination: s.lpk, disconnectCalls: disconnectCallsSpy } as unknown as NostrClient))
			);

			store.dispatch(identityLoaded({ identity }));


			await vi.waitFor(() => {
				if (vi.mocked(subToBeacons).mock.calls.length === 0) throw new Error
			})

			const goodUnix = Math.floor(artificalNowMs / 1000);
			for (const src of sources) {
				__emitBeacon?.({ createdByPub: src.lpk, name: "beacon", updatedAtUnix: goodUnix, relayUrl: TEST_RELAY_URL });
			}

			await vi.waitFor(() => {
				if (store.getState().scoped!.sources.metadata.entities[sources[0].id].lastSeenAtMs === 500_000) throw new Error
			})

			for (const src of sources) {
				expect(store.getState().scoped!.sources.metadata.entities[src.id].lastSeenAtMs).toBe(goodUnix * 1000);
			}


			// Advance time beyond stale window (150s) and allow one tick to fire
			vi.setSystemTime(artificalNowMs + BEACON_STALE_OLDER_THAN + 20_000); // +180s
			await vi.advanceTimersByTimeAsync(1.7 * 60 * 1000);


			expect(disconnectCallsSpy).toHaveBeenCalledTimes(3);
			expect(disconnectCallsSpy).toHaveBeenCalledWith("Stale beacon from pub");

		});

		it("only calls disconnect for newly stale sources", async () => {
			const [source] = generateSources(1);
			const initialState = getPreloadedSourcesState([source]);
			store = makeStore(initialState);

			const artificalNowMs = 1_000_000;
			vi.setSystemTime(artificalNowMs);


			const disconnectCallsSpy = vi.fn();
			getAllNostrClientsMock.mockReturnValue(
				[({ pubDestination: source.lpk, disconnectCalls: disconnectCallsSpy } as unknown as NostrClient)]
			);

			store.dispatch(identityLoaded({ identity }));


			await vi.waitFor(() => {
				if (vi.mocked(subToBeacons).mock.calls.length === 0) throw new Error
			})

			const goodUnix = Math.floor(artificalNowMs / 1000);

			__emitBeacon?.({ createdByPub: source.lpk, name: "beacon", updatedAtUnix: goodUnix, relayUrl: TEST_RELAY_URL });


			await vi.waitFor(() => {
				if (store.getState().scoped!.sources.metadata.entities[source.id].lastSeenAtMs === 500_000) throw new Error
			})


			expect(store.getState().scoped!.sources.metadata.entities[source.id].lastSeenAtMs).toBe(goodUnix * 1000);



			vi.setSystemTime(artificalNowMs + BEACON_STALE_OLDER_THAN + 20_000); // +180s
			await vi.advanceTimersByTimeAsync(1.7 * 60 * 1000);


			expect(disconnectCallsSpy).toHaveBeenCalledTimes(1);
			expect(disconnectCallsSpy).toHaveBeenCalledWith("Stale beacon from pub");

			// advance timers again and this time it shouldn't call disconnect again
			vi.setSystemTime(artificalNowMs + BEACON_STALE_OLDER_THAN + 20_000); // +180s
			await vi.advanceTimersByTimeAsync(1.7 * 60 * 1000);
			expect(disconnectCallsSpy).toHaveBeenCalledTimes(1);
		});

	});
})




