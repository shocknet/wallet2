import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { sourcesActions, sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { identityLoaded } from "../actions";
import { IdentityType, RuntimeIdentity } from "@/State/identitiesRegistry/types";
import { BeaconUpdate } from "@/Api/nostrHandler";
import { createTestSourceDoc, generateSources, getPreloadedSourcesState, TEST_RELAY_URL } from "@tests/support/sourcesHelpers";
import { beaconWatcherSpec } from "./beaconWatcher";
import { fetchBeaconDiscovery } from "@/Api/nostrHandler";
import { addIdentityLifecycle } from "../lifecycle/lifecycle";
import { BEACON_STALE_OLDER_THAN, SourcesState } from "@/State/scoped/backups/sources/state";
import { getAllNostrClients, getNostrClient, NostrClient, subToBeacons } from "@/Api/nostr";
import { runTimeReducer } from "@/State/runtime/slice";


let __emitBeacon: ((b: BeaconUpdate) => void) | null = null;

vi.mock("@/Api/nostrHandler", () => ({
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


const identity: RuntimeIdentity = {
	type: IdentityType.LOCAL_KEY,
	wrappedDataKeyCiphertext: "cipher",
	label: "label",
	pubkey: "hexhexhex",
	privateKey: "hexhexhex",
	relays: ["wss://example.com"],
	unlockedAtMs: Date.now(),
}






const makeStore = (initialState?: SourcesState) => {



	const listenerMw = createListenerMiddleware();

	const store = configureStore({
		reducer: {
			scoped: combineReducers({
				sources: sourcesSlice.reducer,
			}),
			runtime: runTimeReducer,
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
				if (state.metadata.entities[source.id].lastSeenAtMs === 0) throw new Error("lastSeenAtMs not updated")
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
				if (vi.mocked(subToBeacons).mock.calls.length === 0) throw new Error("sub to beacons not called")
			})

			for (const src of sources) {
				__emitBeacon?.({ createdByPub: src.lpk, name: "beacon", updatedAtUnix: 1_000, relayUrl: TEST_RELAY_URL });
			}

			// one emit should update all sources of lpk "knownlpk"
			__emitBeacon?.({ createdByPub: knownLpkSources[0].lpk, name: "known-lpk-beacon", updatedAtUnix: 2_000, relayUrl: TEST_RELAY_URL });

			await vi.waitFor(() => {
				if (vi.mocked(getNostrClient).mock.calls.length !== 6) throw new Error("getNostrClient not called")
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
})




