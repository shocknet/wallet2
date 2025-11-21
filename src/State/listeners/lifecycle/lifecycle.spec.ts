import { describe, it, expect, vi } from "vitest";
import { configureStore, createAction, createSlice, TaskAbortError, createListenerMiddleware } from "@reduxjs/toolkit";
import { identityLoaded, identityUnloaded, listenerKick } from "../actions";
import { IdentityType, type Identity } from "@/State/identitiesRegistry/types";
import { createDeferred, Deferred } from "@/lib/deferred";
import { addIdentityLifecycle, ListenerSpec } from "./lifecycle";




const someActionA = createAction<{ deferred: Deferred<void> }>("@@@@someActionA");
const someActionB = createAction<{ deferred: Deferred<void> }>("@@@@someActionB");
const testAction = createAction("@@@test-action")

const makeStore = (specs: ListenerSpec[]) => {
	const nopSlice = createSlice({
		name: "nop",
		initialState: 0,
		reducers: {},
	});
	const listenerMw = createListenerMiddleware();


	const store = configureStore({
		reducer: { nop: nopSlice.reducer },
		middleware: gdm => gdm({ serializableCheck: { ignoredActions: [testAction.type, someActionA.type, someActionB.type] } }).prepend(listenerMw.middleware),
	});
	type AppStore = typeof store;
	type RootState = ReturnType<AppStore["getState"]>;
	type AppDispatch = AppStore["dispatch"];


	const startAppListening = listenerMw.startListening.withTypes<
		RootState,
		AppDispatch
	>();

	// @ts-expect-error nevermind not the full store, just sources slice
	addIdentityLifecycle(startAppListening, specs);

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




describe("middleware lifecycle", () => {
	it("registers specs on identityLoaded, dispatches kick, and unsubscribes on identityUnloaded then resolves deferred", async () => {
		const effectSpy = vi.fn();

		const spec: ListenerSpec = {
			name: "beacons",
			listeners: [
				(add) =>
					add({
						actionCreator: listenerKick,
						effect: effectSpy
					})
			]

		};
		const { store } = makeStore([spec]);


		expect(effectSpy).toHaveBeenCalledTimes(0);

		store.dispatch(identityLoaded({ identity }));

		expect(effectSpy).toHaveBeenCalledTimes(1);


		const d = createDeferred<void>();
		const resolveSpy = vi.spyOn(d, "resolve");

		expect(resolveSpy).toHaveBeenCalledTimes(0);

		store.dispatch(identityUnloaded({ deferred: d }));


		await d;
		expect(resolveSpy).toHaveBeenCalledTimes(1);


		store.dispatch(listenerKick());
		expect(effectSpy).toHaveBeenCalledTimes(1);
	});

	it("re-subscribes after unload so a new identityLoaded registers again", async () => {
		const effectSpy = vi.fn();
		const spec: ListenerSpec = {
			name: "listener",
			listeners: [
				(add) =>
					add({
						actionCreator: listenerKick,
						effect: effectSpy
					})
			],
		}


		const { store } = makeStore([spec]);


		store.dispatch(identityLoaded({ identity }));
		expect(effectSpy).toHaveBeenCalledTimes(1);

		const d1 = createDeferred<void>();
		store.dispatch(identityUnloaded({ deferred: d1 }));
		await d1;


		store.dispatch(identityLoaded({ identity }));
		expect(effectSpy).toHaveBeenCalledTimes(2);
	});

	it("stores and calls unsubscribes for multiple specs", async () => {
		const testAction = createAction("actionWeNeverDispatch")

		let firstStarted = false;
		let secondStarted = false;
		let thirdStarted = false;

		let firstWasCancelled = false;
		let secondWasCancelled = false;
		let thirdWasCancelled = false;



		const specs: ListenerSpec[] = [
			{
				name: "listener1",
				listeners: [
					(add) =>
						add({
							actionCreator: listenerKick,
							effect: async (_, listenerApi) => {
								firstStarted = true;
								try {
									await listenerApi.condition(testAction.match);
								} catch (err) {
									if (err instanceof TaskAbortError) {
										firstWasCancelled = true
									}
								}
							}
						}),
					(add) =>
						add({
							actionCreator: listenerKick,
							effect: async (_, listenerApi) => {
								secondStarted = true;
								try {
									await listenerApi.condition(testAction.match);
								} catch (err) {
									if (err instanceof TaskAbortError) {
										secondWasCancelled = true
									}
								}
							}
						})
				]
			},
			{
				name: "listener2",
				listeners: [
					(add) =>
						add({
							actionCreator: listenerKick,
							effect: async (_, listenerApi) => {
								thirdStarted = true;
								try {
									await listenerApi.condition(testAction.match);
								} catch (err) {
									if (err instanceof TaskAbortError) {
										thirdWasCancelled = true
									}
								}
							}
						})
				]
			}
		];
		const { store } = makeStore(specs);



		store.dispatch(identityLoaded({ identity }));



		expect(firstStarted).toBe(true);
		expect(secondStarted).toBe(true);
		expect(thirdStarted).toBe(true);


		expect(firstWasCancelled).toBe(false);
		expect(secondWasCancelled).toBe(false);
		expect(thirdWasCancelled).toBe(false);


		const d = createDeferred<void>();



		store.dispatch(identityUnloaded({ deferred: d }));


		await d;
	});

	it("awaits specs' beforeUnload if present before finishing cycle", async () => {
		const deferredA = createDeferred<void>();
		const deferredB = createDeferred<void>();
		const dASpy = vi.spyOn(deferredA, "resolve");
		const dBSpy = vi.spyOn(deferredB, "resolve");


		let listener3Value = 0;

		const specs: ListenerSpec[] = [
			{
				name: "listener1",
				listeners: [
					(add) =>
						add({
							actionCreator: listenerKick,
							effect: async (_, listenerApi) => {
								const [action] = await listenerApi.take(someActionA.match);

								action.payload.deferred.resolve();
							}
						})
				],
				beforeUnload: ({ dispatch }) => { dispatch(someActionA({ deferred: deferredA })); return deferredA }

			},
			{
				name: "listener2",
				listeners: [
					(add) =>
						add({
							actionCreator: listenerKick,
							effect: async (_, listenerApi) => {
								const [action] = await listenerApi.take(someActionB.match);

								action.payload.deferred.resolve();
							}
						})
				],
				beforeUnload: ({ dispatch }) => { dispatch(someActionB({ deferred: deferredB })); return deferredB }
			},

			{
				name: "listener3",
				listeners: [
					(add) =>
						add({
							actionCreator: listenerKick,
							effect: async () => {
								listener3Value++
							}
						})
				],
				// no beforeUnload
			},

		]

		const { store } = makeStore(specs);


		store.dispatch(identityLoaded({ identity }));






		const d = createDeferred<void>();
		store.dispatch(identityUnloaded({ deferred: d }));

		expect(dASpy).toHaveBeenCalledTimes(0);
		expect(dBSpy).toHaveBeenCalledTimes(0);
		await d;
		expect(dASpy).toHaveBeenCalledTimes(1);
		expect(dBSpy).toHaveBeenCalledTimes(1);
		expect(listener3Value).toEqual(1);



	});
});

