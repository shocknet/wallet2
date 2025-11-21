import { sourcesActions, sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { createTestSourceDoc, generateSources, getPreloadedIdentityState, getPreloadedSourcesState } from "@tests/support/sourcesHelpers";
import { publisherSpec } from "./publisher";
import { identityLoaded, publisherFlushRequested } from "../actions";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import { describe, vi, expect, it, beforeEach } from "vitest";
import { saveNip78Event, saveSourceDocEvent } from "@/State/identitiesRegistry/helpers/nostr";
import { addIdentityLifecycle } from "../lifecycle/lifecycle";
import { SourcesState } from "@/State/scoped/backups/sources/state";
import { identitiesRegistryActions, identitiesRegistrySlice } from "@/State/identitiesRegistry/slice";
import { identityActions, identitySlice } from "@/State/scoped/backups/identity/slice";
import { createDeferred } from "@/lib/deferred";


vi.mock("@/State/identitiesRegistry/helpers/identityNostrApi", () => ({
	default: vi.fn()
}));

vi.mock("@/State/identitiesRegistry/helpers/nostr", () => {

	return {
		getSourceDocDtag: vi.fn(async (lpk: string, sourceId: string) => lpk + sourceId),
		saveSourceDocEvent: vi.fn().mockResolvedValue(20),
		saveNip78Event: vi.fn().mockResolvedValue(420)
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
	addIdentityLifecycle(startAppListening, [publisherSpec]);

	store.dispatch(identitiesRegistryActions._createNewIdentity({ identity }));

	store.dispatch(identitiesRegistryActions.setActiveIdentity({ pubkey: identity.pubkey }));

	store.dispatch(identityLoaded({ identity }));



	return store;
}

let store = makeStore();

describe("publisher", () => {

	beforeEach(() => {
		vi.resetAllMocks();

	});


	it("makes a publish for a source change or a new source", async () => {
		const [source] = generateSources(1);

		store = makeStore(getPreloadedSourcesState([source]));


		expect(store.getState().scoped!.sources.docs.entities[source.id].dirty).toBe(true);


		// test mutating action
		store.dispatch(sourcesActions.updateSourceLabel({ sourceId: source.id, label: "label-update", by: "me" }));
		await vi.waitFor(() => {
			if (store.getState().scoped!.sources.docs.entities[source.id].dirty) throw new Error;
		});

		expect(store.getState().scoped!.sources.docs.entities[source.id].dirty).toBe(false);
		expect(saveSourceDocEvent).toHaveBeenCalledTimes(1);


		// test new source
		const [newSource] = generateSources(1, "new-source");
		const newSourceDoc = createTestSourceDoc(newSource.lpk, newSource.id);

		store.dispatch(sourcesActions._createDraftDoc({ sourceId: newSourceDoc.source_id, draft: newSourceDoc }));
		expect(store.getState().scoped!.sources.docs.entities[newSourceDoc.source_id].dirty).toBe(true);

		await vi.waitFor(() => {
			if (store.getState().scoped!.sources.docs.entities[newSourceDoc.source_id].dirty) throw new Error;
		});

		expect(store.getState().scoped!.sources.docs.entities[newSourceDoc.source_id].dirty).toBe(false);
		expect(saveSourceDocEvent).toHaveBeenCalledTimes(2);

	});

	it("makes a publish for an identity data change", async () => {
		const sources = generateSources(2);

		store = makeStore(getPreloadedSourcesState(sources));


		expect(store.getState().scoped!.identity.dirty).toBe(true);
		expect(store.getState().scoped!.identity.draft!.favorite_source_id.value).toBe(sources[0].id);



		store.dispatch(identityActions.setFavoriteSource({ sourceId: sources[1].id, by: "me" }));
		await vi.waitFor(() => { // wait to become dirty
			if (store.getState().scoped!.identity.dirty) throw new Error;
		});

		expect(store.getState().scoped!.identity.dirty).toBe(false);
		expect(saveNip78Event).toHaveBeenCalledTimes(1);
		expect(store.getState().scoped!.identity.draft!.favorite_source_id.value).toBe(sources[1].id);

	});

	it("buffers nostr writes and cancels out old ones for newer ones", async () => {
		const sources = generateSources(3);

		store = makeStore(getPreloadedSourcesState(sources));


		// source
		expect(store.getState().scoped!.sources.docs.entities[sources[0].id].dirty).toBe(true);
		store.dispatch(sourcesActions.updateSourceLabel({ sourceId: sources[0].id, label: "label-update", by: "me" }));
		store.dispatch(sourcesActions.updateSourceLabel({ sourceId: sources[0].id, label: "second-label-update", by: "me" }));

		await vi.waitFor(() => {
			if (store.getState().scoped!.sources.docs.entities[sources[0].id].dirty) throw new Error;
		});
		expect(saveSourceDocEvent).toHaveBeenCalledTimes(1);



		//identity
		expect(store.getState().scoped!.identity.dirty).toBe(true);
		expect(store.getState().scoped!.identity.draft!.favorite_source_id.value).toBe(sources[0].id);


		store.dispatch(identityActions.setFavoriteSource({ sourceId: sources[1].id, by: "me" }));
		store.dispatch(identityActions.setFavoriteSource({ sourceId: sources[2].id, by: "me" }));
		await vi.waitFor(() => { // wait to become dirty
			if (store.getState().scoped!.identity.dirty) throw new Error;
		});
		expect(saveNip78Event).toHaveBeenCalledTimes(1);
		expect(store.getState().scoped!.identity.draft!.favorite_source_id.value).toBe(sources[2].id);
	});

	it("it flushes all buffered writes upon receiving flush request and then resolves promise", async () => {

		const sources = generateSources(3);

		store = makeStore(getPreloadedSourcesState(sources));

		for (const src of sources) {
			store.dispatch(sourcesActions.updateSourceLabel({ sourceId: src.id, label: "label-update", by: "me" }));
		}

		store.dispatch(identityActions.setFavoriteSource({ sourceId: sources[1].id, by: "me" }));

		await Promise.resolve();

		const deferred = createDeferred<void>();
		store.dispatch(publisherFlushRequested({ deferred }));

		await expect(deferred).resolves.toBeUndefined();

		expect(saveSourceDocEvent).toHaveBeenCalledTimes(3);
		expect(saveNip78Event).toHaveBeenCalledTimes(1);
	})
})
