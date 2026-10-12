import usdToBTCReducer from '../Slices/usdToBTCSlice';
import prefsSlice from '../Slices/prefsSlice';
import addressbookSlice from '../Slices/addressbookSlice';
import notificationSlice from '../Slices/notificationSlice';
import generatedAssets from '../Slices/generatedAssets';
import loadingOverlay from '../Slices/loadingOverlay';
import subscriptionsSlice from '../Slices/subscriptionsSlice';
import oneTimeInviteLinkSlice from '../Slices/oneTimeInviteLinkSlice';
import { createIdentitiesRegistryReducer } from '../identitiesRegistry/slice';
import { appApi } from '../api/api';
import { persistedAppStateReducer } from '../appState/slice';
import { runTimeReducer } from '../runtime/slice';
import { shellReducer } from '../../shell/slice';
import { clinkRequestsReducer } from '../clinkRequests/slice';
import { Storage } from 'redux-persist';


// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LazyLoadedSlices { }

export function createRootReducer(storage: Storage) {
	return {
		usdToBTC: usdToBTCReducer,
		prefs: prefsSlice,
		addressbook: addressbookSlice,
		notify: notificationSlice,
		subscriptions: subscriptionsSlice,
		generatedAssets,
		loadingOverlay,
		oneTimeInviteLinkSlice,
		identitiesRegistry: createIdentitiesRegistryReducer(storage),
		appState: persistedAppStateReducer,
		runtime: runTimeReducer,
		[appApi.reducerPath]: appApi.reducer,
		shell: shellReducer,
		clinkRequests: clinkRequestsReducer,
	};
}
