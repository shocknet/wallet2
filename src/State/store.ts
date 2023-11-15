// src/state/store.ts

import { configureStore } from '@reduxjs/toolkit';
import paySourcesReducer from './Slices/paySourcesSlice';
import spendSourcesReducer from './Slices/spendSourcesSlice';
import usdToBTCReducer from './Slices/usdToBTCSlice';
import prefsSlice from './Slices/prefsSlice';
import transactionSlice from './Slices/transactionSlice';
import historySlice from './Slices/HistorySlice';
import { useDispatch as originalUseDispatch, useSelector as originalUseSelector } from 'react-redux';

const store = configureStore({
  reducer: {
    paySource: paySourcesReducer,
    spendSource: spendSourcesReducer,
    usdToBTC: usdToBTCReducer,
    prefs: prefsSlice,
    transaction: transactionSlice,
    history: historySlice
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
