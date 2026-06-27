import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";
import { identityLoaded } from "@/State/listeners/actions";
import { addIdentityLifecycle } from "@/State/listeners/lifecycle/lifecycle";
import { identitiesRegistryActions, identitiesRegistrySlice } from "@/State/identitiesRegistry/slice";
import { IdentityType, RuntimeIdentityKeys } from "@/State/identitiesRegistry/types";
import { identitySlice } from "@/State/scoped/backups/identity/slice";
import { sourcesActions, sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { topicIndexSyncSpec } from "./topicIndexSync";
import { createTestSourceDoc } from "@tests/support/sourcesHelpers";

const runtimeIdentity: RuntimeIdentityKeys = {
	type: IdentityType.LOCAL_KEY,
	label: "label",
	unlockedAtMs: Date.now(),
	pubkey: "hexhexhex",
	privateKey: "hexhexhex",
	relays: ["wss://example.com"],
	wrappedDataKeyCiphertext: "cipher",
};

function makeStore() {
	const listenerMw = createListenerMiddleware();
	const store = configureStore({
		reducer: {
			identitiesRegistry: identitiesRegistrySlice.reducer,
			scoped: combineReducers({
				identity: identitySlice.reducer,
				sources: sourcesSlice.reducer,
			}),
		},
		middleware: (gdm) => gdm({ serializableCheck: false }).prepend(listenerMw.middleware),
	});
	type AppStore = typeof store;
	type RootState = ReturnType<AppStore["getState"]>;
	type AppDispatch = AppStore["dispatch"];
	const startAppListening = listenerMw.startListening.withTypes<RootState, AppDispatch>();
	// @ts-expect-error partial store setup is enough for listener tests
	addIdentityLifecycle(startAppListening, [topicIndexSyncSpec]);
	return store;
}

describe("topicIndexSync listener", () => {
	function bootIdentity(store: ReturnType<typeof makeStore>) {
		store.dispatch(identitiesRegistryActions.setActiveIdentityRuntime({ identity: runtimeIdentity }));
		store.dispatch(identityLoaded({ identity: runtimeIdentity }));
	}

	it("indexes topic id when setTopicId fires for the active identity", () => {
		const store = makeStore();
		const sourceId = "source-1";
		const topicId = "topic-1";

		bootIdentity(store);
		store.dispatch(sourcesActions._createDraftDoc({
			sourceId,
			draft: createTestSourceDoc(runtimeIdentity.pubkey, sourceId),
		}));
		store.dispatch(sourcesActions.setTopicId({ sourceId, topicId }));

		expect(store.getState().identitiesRegistry.topicIndexById[topicId]).toEqual({
			identityId: runtimeIdentity.pubkey,
			sourceId,
		});
	});

	it("removes topic id from the index when a source is marked deleted", () => {
		const store = makeStore();
		const sourceId = "source-1";
		const topicId = "topic-1";

		bootIdentity(store);
		store.dispatch(sourcesActions._createDraftDoc({
			sourceId,
			draft: createTestSourceDoc(runtimeIdentity.pubkey, sourceId),
		}));
		store.dispatch(sourcesActions.setTopicId({ sourceId, topicId }));

		expect(store.getState().identitiesRegistry.topicIndexById[topicId]).toBeDefined();

		store.dispatch(sourcesActions.markDeleted({ sourceId, by: "test-device" }));

		expect(store.getState().identitiesRegistry.topicIndexById[topicId]).toBeUndefined();
	});
});
