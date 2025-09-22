import paySourcesReducer from '../Slices/paySourcesSlice';
import spendSourcesReducer from '../Slices/spendSourcesSlice';
import usdToBTCReducer from '../Slices/usdToBTCSlice';
import prefsSlice from '../Slices/prefsSlice';
import addressbookSlice from '../Slices/addressbookSlice';
import notificationSlice from '../Slices/notificationSlice';
import generatedAssets from '../Slices/generatedAssets';
import loadingOverlay from '../Slices/loadingOverlay';
import subscriptionsSlice from '../Slices/subscriptionsSlice';
import oneTimeInviteLinkSlice from '../Slices/oneTimeInviteLinkSlice';
import nostrPrivateKey from '../Slices/nostrPrivateKey';
import modalsSlice from '../Slices/modalsSlice';
import { combineSlices } from '@reduxjs/toolkit';
import { persistedIdentitiesRegistryReducer } from '../identitiesRegistry/slice';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LazyLoadedSlices { }

export const staticReducers = combineSlices({
	paySource: paySourcesReducer,
	spendSource: spendSourcesReducer,
	usdToBTC: usdToBTCReducer,
	prefs: prefsSlice,
	addressbook: addressbookSlice,
	notify: notificationSlice,
	subscriptions: subscriptionsSlice,
	generatedAssets,
	loadingOverlay,
	nostrPrivateKey,
	oneTimeInviteLinkSlice,
	modalsSlice,
	identitiesRegistry: persistedIdentitiesRegistryReducer
}).withLazyLoadedSlices<LazyLoadedSlices>();
