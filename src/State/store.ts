// src/state/store.ts

import { configureStore } from '@reduxjs/toolkit';
import paySourcesReducer, { storageKey as paySourcesStorageKey, mergeLogic as paySourcesMergeLogic } from './Slices/paySourcesSlice';
import spendSourcesReducer, { storageKey as spendSourcesStorageKey, mergeLogic as spendSourcesMergeLogic } from './Slices/spendSourcesSlice';
import usdToBTCReducer from './Slices/usdToBTCSlice';
import prefsSlice, { storageKey as prefsStorageKey, mergeLogic as prefsMergeLogic } from './Slices/prefsSlice';
import addressbookSlice, { storageKey as addressbookStorageKey, mergeLogic as addressbookMergeLogic } from './Slices/addressbookSlice';
import historySlice, { storageKey as historyStorageKey, mergeLogic as historyMergeLogic } from './Slices/HistorySlice';
import notificationSlice, { storageKey as notificationStorageKey, mergeLogic as notificationMergeLogic } from './Slices/notificationSlice';
import generatedAssets from './Slices/generatedAssets';
import loadingOverlay from './Slices/loadingOverlay';
import subscriptionsSlice, { storageKey as subscriptionsStorageKey, mergeLogic as subscriptionsMergeLogic } from './Slices/subscriptionsSlice';
import { useDispatch as originalUseDispatch, useSelector as originalUseSelector } from 'react-redux';

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

    loadingOverlay
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