import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { addBeaconWatcherListener } from "../beaconWatcher";
import { identityLoaded } from "../actions";
import { Identity, IdentityType } from "../../types";
import { SourcesState } from "@/State/scoped/backups/sources/state";
import { newLww } from "@/State/scoped/backups/lww";
import { SourceType } from "@/State/scoped/common";
import { SourceDocV0 } from "@/State/scoped/backups/sources/schema";
import { Satoshi } from "@/lib/types/units";
import { SourceMetadata } from "@/State/scoped/backups/sources/metadata/types";
import { BeaconUpdate } from "@/Api/nostrHandler";




const lpk1 = "lpk-abc";
const lpk2 = "lpk-def";
const source1Id = "source1";
const source2Id = "source2";

const artificalNowMs = 1_000_000;
const beaconStaleMs = 150_000;







const disconnectCallsSpy = vi.fn();
let __emitBeacon: ((b: BeaconUpdate) => void) | null = null;
vi.mock("@/Api/nostr", () => ({
	getAllNostrClients: () => ([
		{ pubDestination: lpk1, disconnectCalls: disconnectCallsSpy },
		{ pubDestination: lpk2, disconnectCalls: disconnectCallsSpy },
	]),
	subToBeacons: (cb: typeof __emitBeacon) => {
		__emitBeacon = cb;
		return () => { __emitBeacon = null; };
	},
}));


const identity: Identity = {
	type: IdentityType.LOCAL_KEY,
	label: "label",
	createdAt: Date.now(),
	pubkey: "hexhexhex",
	privkey: "hexhexhex",
	relays: ["wss://example.com"]
}



const createTestSourceDoc = (sourceLpk: string, sourceId: string): SourceDocV0 => ({
	doc_type: "doc/shockwallet/source_",
	source_id: sourceId,
	schema_rev: 0,
	label: newLww(null, "me"),
	relays: {},
	bridgeUrl: newLww(null, "me"),
	admin_token: newLww(null, "me"),
	is_ndebit_discoverable: newLww(false, "me"),
	deleted: newLww(false, "me"),
	type: SourceType.NPROFILE_SOURCE,
	lpk: sourceLpk,
	keys: {
		publicKey: "hexhex",
		privateKey: "hexhex"
	},
	created_at: Date.now()

})

const createTestSourceMetadata = (sourceLpk: string, sourceId: string): SourceMetadata => ({
	stale: false,
	lastSeenAtMs: 500_000,
	balance: 0 as Satoshi,
	maxWithdrable: 0 as Satoshi,
	id: sourceId,
	lpk: sourceLpk


})


const preloadedSourcesState: SourcesState = {
	docs: {
		entities: {
			[source1Id]: {
				draft: createTestSourceDoc(lpk1, source1Id),
				dirty: false,
			},
			[source2Id]: {
				draft: createTestSourceDoc(lpk2, source2Id),
				dirty: false,
			}
		},
		ids: [source1Id, source2Id]
	},
	metadata: {
		entities: {
			[source1Id]: createTestSourceMetadata(lpk1, source1Id),
			[source2Id]: createTestSourceMetadata(lpk2, source2Id)
		},
		ids: [source1Id, source2Id],
		beaconStaleMs
	},
	history: {
		ops: {
			entities: {/* empty */ },
			ids: []
		},
		bySource: {/* empty */ },
		newPaymentsCount: 0
	}
}
const makeStore = () => {
	const listener = createListenerMiddleware();
	const store = configureStore({
		reducer: {
			scoped: combineReducers({
				sources: sourcesSlice.reducer
			})

		},
		preloadedState: {
			scoped: {
				sources: preloadedSourcesState
			}
		},
		middleware: (gDM) => gDM().prepend(listener.middleware),
	});
	type AppStore = typeof store;
	type RootState = ReturnType<AppStore["getState"]>;
	type AppDispatch = AppStore["dispatch"];


	const startAppListening = listener.startListening.withTypes<
		RootState,
		AppDispatch
	>();

	// @ts-expect-error nevermind not the full store, just sources slice
	addBeaconWatcherListener(startAppListening);



	return store;

}
describe("beaconWatcher listener middleware", () => {

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(artificalNowMs); // base time = 1,000,000 ms
		disconnectCallsSpy.mockClear();
	});
	afterEach(() => {
		vi.useRealTimers();
	});


	it("Marks a source as stale AND disconnect its nostr client if its lastSeenAtMs doesn't satisfy the threshold beaconStaleMs", async () => {
		const store = makeStore();
		let state = store.getState().scoped.sources;
		expect(state.metadata.entities[source1Id].stale).toBe(false);
		expect(state.metadata.entities[source2Id].stale).toBe(false);

		store.dispatch(identityLoaded({ identity }));

		await Promise.resolve();


		state = store.getState().scoped.sources;
		expect(state.metadata.entities[source1Id].stale).toBe(true);
		expect(state.metadata.entities[source2Id].stale).toBe(true);
		expect(disconnectCallsSpy).toHaveBeenCalledTimes(2);
		expect(disconnectCallsSpy).toHaveBeenCalledWith("Stale beacon from pub");




	});

	it("does NOT set to non stale if a stale beacon arrives; it stays stale until a beacon that satisfies threshold arrives", async () => {

		const store = makeStore();

		store.dispatch(identityLoaded({ identity }));

		await Promise.resolve();

		let state = store.getState().scoped.sources;
		expect(state.metadata.entities[source1Id].stale).toBe(true);
		expect(state.metadata.entities[source2Id].stale).toBe(true);

		const badUnix = Math.floor((artificalNowMs - 5 * 60_000) / 1000); // 5 minutes old
		__emitBeacon?.({ createdByPub: lpk1, updatedAtUnix: badUnix, name: "stale beacon" });

		await Promise.resolve();

		state = store.getState().scoped.sources;
		expect(state.metadata.entities[source1Id].lastSeenAtMs).toBeLessThan(artificalNowMs - beaconStaleMs);
		expect(state.metadata.entities[source1Id].stale).toBe(true);
		expect(state.metadata.entities[source2Id].stale).toBe(true);


		const goodUnix = Math.floor(1_000_000 / 1000);
		__emitBeacon?.({ createdByPub: lpk1, updatedAtUnix: goodUnix, name: "good beacon" });

		await Promise.resolve();
		state = store.getState().scoped.sources;

		expect(state.metadata.entities[source1Id].lastSeenAtMs).toBeGreaterThanOrEqual(artificalNowMs);
		expect(state.metadata.entities[source1Id].stale).toBe(false);
		expect(state.metadata.entities[source2Id].stale).toBe(true);


	});

	it("disconnects clients exactly once when the lpk becomes stale on the next tick", async () => {
		const store = makeStore();
		store.dispatch(identityLoaded({ identity }));

		await Promise.resolve();

		let state = store.getState().scoped.sources;
		expect(state.metadata.entities[source1Id].stale).toBe(true);
		expect(state.metadata.entities[source2Id].stale).toBe(true);
		expect(disconnectCallsSpy).toHaveBeenCalledTimes(2);
		expect(disconnectCallsSpy).toHaveBeenCalledWith("Stale beacon from pub");



		const goodUnix = Math.floor(1_000_000 / 1000);
		__emitBeacon?.({ createdByPub: lpk1, updatedAtUnix: goodUnix, name: "good beacon" });

		await Promise.resolve();

		state = store.getState().scoped.sources;
		expect(state.metadata.entities[source1Id].stale).toBe(false);
		expect(state.metadata.entities[source2Id].stale).toBe(true);

		expect(disconnectCallsSpy).toHaveBeenCalledTimes(2);
		expect(disconnectCallsSpy).toHaveBeenCalledWith("Stale beacon from pub");




		// Advance time beyond stale window (150s) and allow one tick to fire
		vi.setSystemTime(artificalNowMs + beaconStaleMs + 20_000); // +180s
		vi.advanceTimersByTime(1.7 * 60 * 1000);

		await Promise.resolve();

		state = store.getState().scoped.sources;
		expect(state.metadata.entities[source1Id].stale).toBe(true);
		expect(state.metadata.entities[source2Id].stale).toBe(true);
		expect(disconnectCallsSpy).toHaveBeenCalledTimes(3);



	});
})




