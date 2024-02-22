// src/state/store.ts

import { configureStore, createAction } from '@reduxjs/toolkit';
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
import { MigrationFunction } from './Slices/migrations';
import { migrations as paySourceMigrations, VERSION as paySourceVersion } from './Slices/paySourcesSlice';
import { migrations as spendSourceMigrations, VERSION as spendSourceVersion } from './Slices/spendSourcesSlice';
import { migrations as prefsMigrations, VERSION as prefsVersion } from './Slices/prefsSlice';
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

// was going to be used for import file backup, can stay for future use maybe
type MigrationsReturnType = {
  migrations: Record<number, MigrationFunction<any>>,
  version: number
} | null
export const findReducerMigrations = (storageKey: string): MigrationsReturnType => {
  switch (storageKey) {
    case paySourcesStorageKey:
      return { migrations: paySourceMigrations, version: paySourceVersion }
    case spendSourcesStorageKey:
      return { migrations: spendSourceMigrations, version: spendSourceVersion }
    case prefsStorageKey:
      return { migrations: prefsMigrations, version: prefsVersion }
    default:
      return null;
  }
}