/* import { describe, it, beforeEach, expect, vi } from "vitest";
import { configureStore, createSlice, createAction } from "@reduxjs/toolkit";
import { createListenerMiddleware, addListener } from "@reduxjs/toolkit";
import type { TypedStartListening } from "@reduxjs/toolkit";

import {
	bindOrchestrator,
	__setSpecsForTest,
	type ListenerSpec,
} from "./orchestrator"
import { identityLoaded, identityUnloaded, listenerKick } from "./actions";
import { Identity, IdentityType } from "../types";
import { createDeferred } from "@/lib/deferred";




const makeStore = () => {
	const nopSlice = createSlice({
		name: "nop",
		initialState: 0,
		reducers: {},
	});
	const listenerMw = createListenerMiddleware();


	const store = configureStore({
		reducer: { nop: nopSlice.reducer },
		middleware: gdm => gdm().prepend(listenerMw.middleware),
	});
	type AppStore = typeof store;
	type RootState = ReturnType<AppStore["getState"]>;
	type AppDispatch = AppStore["dispatch"];


	const startAppListening = listenerMw.startListening.withTypes<
		RootState,
		AppDispatch
	>();

	// @ts-expect-error nevermind not the full store, just sources slice
	bindOrchestrator(startAppListening);

	return { store }

}


const identity: Identity = {
	type: IdentityType.LOCAL_KEY,
	label: "label",
	createdAt: Date.now(),
	pubkey: "hexhexhex",
	privkey: "hexhexhex",
	relays: ["wss://example.com"]
}





describe("orchestrator", () => {

	it("registers specs on identityLoaded, kicks immediately, and unsubscribes on identityUnloaded then resolves deferred", async () => {
		const { store } = makeStore();

		const effectSpy = vi.fn((a, api) => {

			api.unsubscribe();
		});

		const spec: ListenerSpec = {
			name: "beacons",
			listener: {
				actionCreator: listenerKick,
				effect: effectSpy,
			},
		};

		__setSpecsForTest([spec]);



		store.dispatch(identityLoaded({ identity }));


		expect(effectSpy).toHaveBeenCalledTimes(1);


		const d = createDeferred<void>();
		const resolveSpy = vi.spyOn(d, "resolve");

		store.dispatch(identityUnloaded({ deferred: d }));


		await d;
		expect(resolveSpy).toHaveBeenCalledTimes(1);


		store.dispatch(listenerKick());
		expect(effectSpy).toHaveBeenCalledTimes(1);
	});

	it("re-subscribes orchestrator after unload so a new identityLoaded registers again", async () => {
		const { store } = makeStore();
		const effectSpy = vi.fn((a, api) => api.unsubscribe());

		__setSpecsForTest([
			{
				name: "beacons",
				listener: { actionCreator: listenerKick, effect: effectSpy },
			},
		]);



		store.dispatch(identityLoaded({ identity }));
		expect(effectSpy).toHaveBeenCalledTimes(1);

		const d1 = createDeferred<void>();
		store.dispatch(identityUnloaded({ deferred: d1 }));
		await d1;


		store.dispatch(identityLoaded({ identity }));
		expect(effectSpy).toHaveBeenCalledTimes(2);
	});

	it("stores and calls unsubscribes for multiple specs", async () => {
		const { store } = makeStore();

		const spyA = vi.fn((a, api) => api.unsubscribe());
		const spyB = vi.fn((a, api) => api.unsubscribe());

		__setSpecsForTest([
			{ name: "A", listener: { actionCreator: listenerKick, effect: spyA } },
			{ name: "B", listener: { actionCreator: listenerKick, effect: spyB } },
		]);


		store.dispatch(identityLoaded({ identity }));
		expect(spyA).toHaveBeenCalledTimes(1);
		expect(spyB).toHaveBeenCalledTimes(1);

		const d = createDeferred();
		store.dispatch(identityUnloaded({ deferred: d }));
		await d;


		store.dispatch(listenerKick());
		expect(spyA).toHaveBeenCalledTimes(1);
		expect(spyB).toHaveBeenCalledTimes(1);
	});
});
 */
