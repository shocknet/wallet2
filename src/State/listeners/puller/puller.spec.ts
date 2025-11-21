import { sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { createTestSourceDoc, generateSources, getPreloadedIdentityState } from "@tests/support/sourcesHelpers";
import { identityLoaded } from "../actions";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import { describe, vi, expect, it, beforeEach } from "vitest";
import { addIdentityLifecycle } from "../lifecycle/lifecycle";
import { SourcesState } from "@/State/scoped/backups/sources/state";
import { identitiesRegistryActions, identitiesRegistrySlice } from "@/State/identitiesRegistry/slice";
import { identitySlice } from "@/State/scoped/backups/identity/slice";
import { pullerSpec } from "./puller";
import { subscribeToNostrEvents } from "@/State/identitiesRegistry/helpers/nostr";


vi.mock("@/State/identitiesRegistry/helpers/identityNostrApi", () => ({
	default: vi.fn()
}));

let __emitDoc: ((decrypted: string) => Promise<void>) | null = null;
vi.mock("@/State/identitiesRegistry/helpers/nostr", () => {

	return {
		subscribeToNostrEvents: vi.fn(async (ext: any, filters: any, cb: typeof __emitDoc) => {
			console.log("been called");
			__emitDoc = cb;
			return () => { __emitDoc = null; }
		})
	}
});







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
				identity: identitySlice.reducer
			}),
			identitiesRegistry: identitiesRegistrySlice.reducer
		},
		preloadedState: {
			scoped: {
				sources: initialState,
				identity: getPreloadedIdentityState(identity.pubkey, initialState?.docs.ids[0])
			}
		},
		middleware: gdm =>
			gdm({ serializableCheck: false }).prepend(listenerMw.middleware),
	});

	type AppStore = typeof store;
	type RootState = ReturnType<AppStore["getState"]>;
	type AppDispatch = AppStore["dispatch"];

	const startAppListening = listenerMw.startListening.withTypes<
		RootState,
		AppDispatch
	>();

	// @ts-expect-error nevermind not the full store, just sources slice
	addIdentityLifecycle(startAppListening, [pullerSpec]);

	store.dispatch(identitiesRegistryActions._createNewIdentity({ identity }));

	store.dispatch(identitiesRegistryActions.setActiveIdentity({ pubkey: identity.pubkey }));





	return store;
}

let store = makeStore();

describe("puller", () => {

	beforeEach(() => {
		vi.resetAllMocks();

	});

	it("receives remote docs", async () => {
		store = makeStore();

		store.dispatch(identityLoaded({ identity }));

		const [source] = generateSources(1);
		const newSourceDoc = createTestSourceDoc(source.lpk, source.id);

		await vi.waitFor(() => {
			if (vi.mocked(subscribeToNostrEvents).mock.calls.length === 0) throw new Error
		})
		__emitDoc?.(JSON.stringify(newSourceDoc));

		await vi.waitFor(() => {
			if (store.getState().scoped!.sources.docs.ids.length === 0) throw new Error;
		});

		expect(store.getState().scoped!.sources.docs.entities[source.id]).toBeDefined();

	})
})
