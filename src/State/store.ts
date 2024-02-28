// src/state/store.ts

import { configureStore, createAction, createSelector } from '@reduxjs/toolkit';
import paySourcesReducer, { storageKey as paySourcesStorageKey, mergeLogic as paySourcesMergeLogic, PaySourceState } from './Slices/paySourcesSlice';
import spendSourcesReducer, { storageKey as spendSourcesStorageKey, mergeLogic as spendSourcesMergeLogic, SpendSourceState } from './Slices/spendSourcesSlice';
import usdToBTCReducer from './Slices/usdToBTCSlice';
import prefsSlice, { storageKey as prefsStorageKey, mergeLogic as prefsMergeLogic } from './Slices/prefsSlice';
import addressbookSlice, { storageKey as addressbookStorageKey, mergeLogic as addressbookMergeLogic } from './Slices/addressbookSlice';
import historySlice, { storageKey as historyStorageKey, mergeLogic as historyMergeLogic } from './Slices/HistorySlice';
import notificationSlice, { storageKey as notificationStorageKey, mergeLogic as notificationMergeLogic } from './Slices/notificationSlice';
import generatedAssets from './Slices/generatedAssets';
import loadingOverlay from './Slices/loadingOverlay';
import subscriptionsSlice, { storageKey as subscriptionsStorageKey, mergeLogic as subscriptionsMergeLogic, Subscriptions } from './Slices/subscriptionsSlice';
import nostrPrivateKey from './Slices/nostrPrivateKey';
import { useDispatch as originalUseDispatch, useSelector as originalUseSelector } from 'react-redux';
export const syncRedux = createAction('SYNC_REDUX');

const store = configureStore({
  reducer: {
    paySource: paySourcesReducer,
    spendSource: spendSourcesReducer,
    usdToBTC: usdToBTCReducer,
    prefs: prefsSlice,
    addressbook: addressbookSlice,
    history: historySlice,
    notify: notificationSlice,
    subscriptions: subscriptionsSlice,
    generatedAssets,
    loadingOverlay,
    nostrPrivateKey
  },
});
export type State = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useDispatch: () => AppDispatch = originalUseDispatch
export const useSelector = <TSelected = unknown>(
  selector: (state: State) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean
): TSelected => originalUseSelector<State, TSelected>(selector, equalityFn);



export default store;

export const findReducerMerger = (storageKey: string): ((l: string, r: string) => string) | null => {
  switch (storageKey) {
    case paySourcesStorageKey:
      return paySourcesMergeLogic
    case spendSourcesStorageKey:
      return spendSourcesMergeLogic
    case prefsStorageKey:
      return prefsMergeLogic
    case addressbookStorageKey:
      return addressbookMergeLogic
    case historyStorageKey:
      return historyMergeLogic
    case notificationStorageKey:
      return notificationMergeLogic
    case subscriptionsStorageKey:
      return subscriptionsMergeLogic
    default:
      return null
  }
}

export const selectNostrSpends = createSelector(
  (state: State) => state.spendSource,
  (spendSource: SpendSourceState) =>
    Object.values(spendSource.sources).filter((s) => s.pubSource)
)

export const selectEnabledSpends = createSelector(
  (state: State) => state.spendSource,
  (spendSource: SpendSourceState) =>
    Object.values(spendSource.sources).filter((s) => !s.disabled)
)

export const selectActiveSubs = createSelector(
  (state: State) => state.subscriptions,
  (subscriptions: Subscriptions) =>
    subscriptions.activeSubs.filter(s => s.enabled)
)

export const selectNostrPays = createSelector(
  (state: State) => state.paySource,
  (paySource: PaySourceState) =>
    Object.values(paySource.sources).filter(s => s.pubSource)
)