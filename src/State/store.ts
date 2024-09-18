// src/state/store.ts

import { combineReducers, configureStore, createAction, createListenerMiddleware, createSelector, TypedStartListening } from '@reduxjs/toolkit';
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
import oneTimeInviteLinkSlice from './Slices/oneTimeInviteLinkSlice';
import nostrPrivateKey from './Slices/nostrPrivateKey';
import { useDispatch as originalUseDispatch, useSelector as originalUseSelector } from 'react-redux';
import backupStateSlice from './Slices/backupState';
import { backup } from './backupMiddleware';
import { BackupAction } from './types';
import { bridgeMiddleware } from './bridgeMiddleware';

export const syncRedux = createAction('SYNC_REDUX');


export const reducer = combineReducers({
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
  nostrPrivateKey,
  backupStateSlice,
  oneTimeInviteLinkSlice
})




const store = configureStore({
  reducer: reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(backup.middleware, bridgeMiddleware.middleware),
});
export type State = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useDispatch: () => AppDispatch = originalUseDispatch
export const useSelector = <TSelected = unknown>(
  selector: (state: State) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean
): TSelected => originalUseSelector<State, TSelected>(selector, equalityFn);





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
    case historyStorageKey:
      return historyMergeLogic
    default:
      return null
  }
}

export const selectNostrSpends = createSelector(
  (state: State) => state.spendSource,
  (spendSource: SpendSourceState) =>
    Object.values(spendSource.sources).filter((s) => s.pubSource && !s.disconnected)
)

export const selectConnectedNostrSpends = createSelector(
  (state: State) => state.paySource,
  (paySource: PaySourceState) =>
    paySource.order.map(id => paySource.sources[id]).filter(source => source.pubSource && !source.disconnected)
)

export const selectEnabledSpends = createSelector(
  (state: State) => state.spendSource,
  (spendSource: SpendSourceState) =>
    spendSource.order.map(id => spendSource.sources[id]).filter(source => !source.disabled)
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