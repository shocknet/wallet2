import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { addBeaconWatcherListener } from "../beaconWatcher";
import { identityLoaded } from "../actions";
import { Identity, IdentityType } from "../../types";
import { BeaconUpdate } from "@/Api/nostrHandler";
import { getPreloadedSourcesState } from "./testsHelpers";











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




const lpk1 = "lpk-abc";
const lpk2 = "lpk-def";
const source1Id = "source1";
const source2Id = "source2";

const beaconStaleMs = 150_000;
const artificalNowMs = 1_000_000;

const makeStore = () => {
	const preloadedState = getPreloadedSourcesState(
		[
			{
				lpk: lpk1,
				id: source1Id,

			},
			{
				lpk: lpk2,
				id: source2Id
			}
		],
		{
			beaconStaleMs
		}
	)
	const listener = createListenerMiddleware();
	const store = configureStore({
		reducer: {
			scoped: combineReducers({
				sources: sourcesSlice.reducer
			})

		},
		preloadedState: {
			scoped: {
				sources: preloadedState
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




