// src/state/store.ts

import { configureStore } from '@reduxjs/toolkit';
import paySourcesReducer from './Slices/paySourcesSlice';
import spendSourcesReducer from './Slices/spendSourcesSlice';
import usdToBTCReducer from './Slices/usdToBTCSlice';
import prefsSlice from './Slices/prefsSlice';
import addressbookSlice from './Slices/addressbookSlice';
import historySlice from './Slices/HistorySlice';
import notificationSlice from './Slices/notificationSlice';
import { useDispatch as originalUseDispatch, useSelector as originalUseSelector } from 'react-redux';

const store = configureStore({
  reducer: {
    paySource: paySourcesReducer,
    spendSource: spendSourcesReducer,
    usdToBTC: usdToBTCReducer,
    prefs: prefsSlice,
    addressbook: addressbookSlice,
    history: historySlice,
    notify: notificationSlice
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
