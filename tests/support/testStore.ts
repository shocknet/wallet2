import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { appApi } from "@/State/api/api";
import { appStateReducer } from "@/State/appState/slice";
import { identitiesRegistrySlice } from "@/State/identitiesRegistry/slice";
import { runTimeReducer } from "@/State/runtime/slice";
import { clinkRequestsReducer } from "@/State/clinkRequests/slice";
import { identitySlice } from "@/State/scoped/backups/identity/slice";
import { sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { beaconsSlice } from "@/State/scoped/beacons/slice";
import { getInitialBeaconsState, type BeaconsState } from "@/State/scoped/beacons/state";
import { getIntialState, type SourcesState } from "@/State/scoped/backups/sources/state";
import type { IdentityState } from "@/State/scoped/backups/identity/slice";
import type { RootState, AppDispatch } from "@/State/store/store";
import type { AppstartListening } from "@/State/store/listenerMiddleware";
import usdToBTCReducer from "@/State/Slices/usdToBTCSlice";
import prefsSlice from "@/State/Slices/prefsSlice";
import addressbookSlice from "@/State/Slices/addressbookSlice";
import notificationSlice from "@/State/Slices/notificationSlice";
import generatedAssets from "@/State/Slices/generatedAssets";
import loadingOverlay from "@/State/Slices/loadingOverlay";
import subscriptionsSlice from "@/State/Slices/subscriptionsSlice";
import oneTimeInviteLinkSlice from "@/State/Slices/oneTimeInviteLinkSlice";
import { shellReducer } from "@/shell/slice";

export type TestScopedState = {
	identity: IdentityState;
	sources: SourcesState;
	beacons: BeaconsState;
};

export type MakeTestStoreOpts = {
	scoped?: Partial<TestScopedState>;
};

export function makeTestStore(opts: MakeTestStoreOpts = {}) {
	const listenerMw = createListenerMiddleware();

	const scoped: TestScopedState = {
		identity: opts.scoped?.identity ?? identitySlice.getInitialState(),
		sources: opts.scoped?.sources ?? getIntialState(),
		beacons: opts.scoped?.beacons ?? getInitialBeaconsState(),
	};

	const store = configureStore({
		reducer: {
			usdToBTC: usdToBTCReducer,
			prefs: prefsSlice,
			addressbook: addressbookSlice,
			notify: notificationSlice,
			subscriptions: subscriptionsSlice,
			generatedAssets,
			loadingOverlay,
			oneTimeInviteLinkSlice,
			identitiesRegistry: identitiesRegistrySlice.reducer,
			appState: appStateReducer,
			runtime: runTimeReducer,
			[appApi.reducerPath]: appApi.reducer,
			shell: shellReducer,
			clinkRequests: clinkRequestsReducer,
			scoped: combineReducers({
				identity: identitySlice.reducer,
				sources: sourcesSlice.reducer,
				beacons: beaconsSlice.reducer,
			}),
		},
		preloadedState: { scoped },
		middleware: gdm =>
			gdm({ serializableCheck: false })
				.prepend(listenerMw.middleware)
				.concat(appApi.middleware),
	});

	const startAppListening = listenerMw.startListening.withTypes<
		RootState,
		AppDispatch
	>() as AppstartListening;

	return { store, startAppListening };
}

export type TestStore = ReturnType<typeof makeTestStore>["store"];
