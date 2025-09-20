

import { Action, combineSlices, configureStore, createAction, createListenerMiddleware, createSelector, createSlice, ThunkAction, ThunkDispatch, TypedStartListening } from '@reduxjs/toolkit';
import paySourcesReducer, { storageKey as paySourcesStorageKey, mergeLogic as paySourcesMergeLogic, PaySourceState } from '../Slices/paySourcesSlice';
import spendSourcesReducer, { storageKey as spendSourcesStorageKey, mergeLogic as spendSourcesMergeLogic, SpendSourceState } from '../Slices/spendSourcesSlice';
import usdToBTCReducer from '../Slices/usdToBTCSlice';
import prefsSlice, { storageKey as prefsStorageKey, mergeLogic as prefsMergeLogic } from '../Slices/prefsSlice';
import addressbookSlice, { storageKey as addressbookStorageKey, mergeLogic as addressbookMergeLogic } from '../Slices/addressbookSlice';
import notificationSlice, { storageKey as notificationStorageKey, mergeLogic as notificationMergeLogic } from '../Slices/notificationSlice';
import generatedAssets from '../Slices/generatedAssets';
import loadingOverlay from '../Slices/loadingOverlay';
import subscriptionsSlice, { storageKey as subscriptionsStorageKey, mergeLogic as subscriptionsMergeLogic, Subscriptions } from '../Slices/subscriptionsSlice';
import oneTimeInviteLinkSlice from '../Slices/oneTimeInviteLinkSlice';
import nostrPrivateKey from '../Slices/nostrPrivateKey';
import { useDispatch as originalUseDispatch, useSelector as originalUseSelector } from 'react-redux';

import { createDynamicMiddleware } from "@reduxjs/toolkit/react";
import type { BackupAction } from '../types';

import { FLUSH, PAUSE, PERSIST, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import { parseUserInputToSats } from '@/lib/units';
import type { Satoshi } from '@/lib/types/units';
import type { PayTo, SpendFrom } from '@/globalTypes';
import { staticReducers } from './staticReducers';
import { listenerMiddleware } from './listenerMiddleware';

import { injectLastActive } from '../scoped/scopedReducer';
import { LAST_ACTIVE_IDENTITY_PUBKEY_KEY } from '../identitiesRegistry/thunks';








export const dynamicMiddleware = createDynamicMiddleware();
const store = configureStore({
	reducer: staticReducers,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, PAUSE, PERSIST, REHYDRATE, PURGE, REGISTER],
			},
		}).prepend(dynamicMiddleware.middleware).prepend(listenerMiddleware.middleware)
});


const pubkey = localStorage.getItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);
if (pubkey) {
	injectLastActive(pubkey)
}
export const persistor = persistStore(store);




export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunkDispatch = ThunkDispatch<RootState, unknown, Action>;
export type AppThunk<T> = ThunkAction<
	T,
	RootState,
	unknown,
	Action
>;
export const useDispatch: () => AppDispatch = originalUseDispatch
export const useSelector = <TSelected = unknown>(
	selector: (state: RootState) => TSelected,
	equalityFn?: (left: TSelected, right: TSelected) => boolean
): TSelected => originalUseSelector<RootState, TSelected>(selector, equalityFn);





export default store;
export const findReducerMerger = (storageKey: string): ((l: string, r: string) => { data: string, actions: BackupAction[] }) | null => {
	switch (storageKey) {
		case paySourcesStorageKey:
			return paySourcesMergeLogic
		case spendSourcesStorageKey:
			return spendSourcesMergeLogic
		case prefsStorageKey:
			return prefsMergeLogic
		case addressbookStorageKey:
			return addressbookMergeLogic
		default:
			return null
	}
}

export const selectNostrSpends = createSelector(
	(state: RootState) => state.spendSource,
	(spendSource: SpendSourceState) =>
		Object.values(spendSource.sources).filter((s) => s.pubSource && !s.disconnected)
)

export const selectConnectedNostrSpends = createSelector(
	(state: RootState) => state.paySource,
	(paySource: PaySourceState) =>
		paySource.order.map(id => paySource.sources[id]).filter(source => source.pubSource && !source.disconnected)
)

export const selectEnabledSpends = createSelector(
	(state: RootState) => state.spendSource,
	(spendSource: SpendSourceState) =>
		spendSource.order.map(id => spendSource.sources[id]).filter(source => !source.disabled)
)

export const selectActiveSubs = createSelector(
	(state: RootState) => state.subscriptions,
	(subscriptions: Subscriptions) =>
		subscriptions.activeSubs.filter(s => s.enabled)
)

export const selectNostrPays = createSelector(
	(state: RootState) => state.paySource,
	(paySource: PaySourceState) =>
		Object.values(paySource.sources).filter(s => s.pubSource)
)


export const selectSpendsTotalBalance = createSelector(
	selectEnabledSpends,
	(sources) => {
		const result = sources.reduce((acc, source) => {
			return (acc + parseUserInputToSats(source.balance, "sats")) as Satoshi
		}, 0);
		return result as Satoshi;
	}
)

export const selectSourceById = createSelector(
	[
		(state: RootState) => state.spendSource.sources,
		(state: RootState) => state.paySource.sources,
		(_state: RootState, id: string) => id,
	],
	(spendSources, paySources, id): PayTo | SpendFrom => {

		return spendSources[id] ?? paySources[id];
	}
);
