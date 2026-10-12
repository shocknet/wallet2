import { combineReducers, configureStore, createListenerMiddleware, type Action } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";
import { addIdentityLifecycle, type ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { identitiesRegistryActions, identitiesRegistrySlice } from "@/State/identitiesRegistry/slice";
import { IdentityType, type IdentityKeys } from "@/State/identitiesRegistry/types";
import { identitySlice } from "@/State/scoped/backups/identity/slice";
import { sourcesActions, sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { scopeCommitted } from "@/State/scope/scopeHost";
import type { ScopedRuntimeIdentity } from "@/shell/types";
import { topicIndexSyncSpec } from "./topicIndexSync";
import { createTestSource } from "@tests/support/sourcesHelpers";
import type { Satoshi } from "@/lib/types/units";

const pubkey = "hexhexhex";
const runtimeIdentity: ScopedRuntimeIdentity = {
	type: IdentityType.LOCAL_KEY,
	pubkey,
	privateKey: "hexhexhex",
	relays: ["wss://example.com"],
	unlockedAtMs: 1,
};
const registryIdentity: IdentityKeys = {
	type: IdentityType.LOCAL_KEY,
	pubkey,
	label: "label",
	createdAt: 1,
	relays: ["wss://example.com"],
	wrappedDataKey: { storage: "inline", wrappedDataKeyCiphertext: "cipher" },
	localSecret: { storage: "inline", privateKey: "hexhexhex" },
};

function makeStore() {
	const listenerMw = createListenerMiddleware();
	const store = configureStore({
		reducer: {
			identitiesRegistry: identitiesRegistrySlice.reducer,
			scoped: combineReducers({
				identity: identitySlice.reducer,
				sources: sourcesSlice.reducer,
				runtimeIdentity: (state: ScopedRuntimeIdentity = runtimeIdentity, _action: Action) => state,
			}),
		},
		middleware: (gdm) => gdm({ serializableCheck: false }).prepend(listenerMw.middleware),
	});
	type AppStore = typeof store;
	type RootState = ReturnType<AppStore["getState"]>;
	type AppDispatch = AppStore["dispatch"];
	const startAppListening = listenerMw.startListening.withTypes<RootState, AppDispatch>();
	addIdentityLifecycle(startAppListening, [topicIndexSyncSpec] as unknown as readonly ListenerSpec<RootState, AppDispatch>[]);
	return store;
}

describe("topicIndexSync listener", () => {
	function bootIdentity(store: ReturnType<typeof makeStore>) {
		store.dispatch(identitiesRegistryActions._createNewIdentity({ identity: registryIdentity }));
		store.dispatch(scopeCommitted());
	}

	it("indexes topic id when applyUserInfo fires with topicId for the active identity", () => {
		const store = makeStore();
		const sourceId = "source-1";
		const topicId = "topic-1";

		bootIdentity(store);
		store.dispatch(sourcesActions._createDraftDoc({
			sourceId,
			draft: createTestSource({ lpk: pubkey, id: sourceId }).doc,
		}));
		store.dispatch(sourcesActions.applyUserInfo({
			sourceId,
			balance: 0 as Satoshi,
			maxWithdrawable: 0 as Satoshi,
			ndebit: "ndebit",
			noffer: "noffer",
			nmanage: "nmanage",
			topicId,
		}));

		expect(store.getState().identitiesRegistry.topicIndexById[topicId]).toEqual({
			identityId: pubkey,
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
			draft: createTestSource({ lpk: pubkey, id: sourceId }).doc,
		}));
		store.dispatch(sourcesActions.applyUserInfo({
			sourceId,
			balance: 0 as Satoshi,
			maxWithdrawable: 0 as Satoshi,
			ndebit: "ndebit",
			noffer: "noffer",
			nmanage: "nmanage",
			topicId,
		}));

		expect(store.getState().identitiesRegistry.topicIndexById[topicId]).toBeDefined();

		store.dispatch(sourcesActions.markDeleted({ sourceId, by: "test-device" }));

		expect(store.getState().identitiesRegistry.topicIndexById[topicId]).toBeUndefined();
	});
});
