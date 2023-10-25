// src/state/store.ts

import { configureStore } from '@reduxjs/toolkit';
import paySourcesReducer from './Slices/paySourcesSlice';
import spendSourcesReducer from './Slices/spendSourcesSlice';
import usdToBTCReducer from './Slices/usdToBTCSlice';
import prefsSlice from './Slices/prefsSlice';
import transactionSlice from './Slices/transactionSlice';

const store = configureStore({
  reducer: {
    paySource: paySourcesReducer,
    spendSource: spendSourcesReducer,
    usdToBTC: usdToBTCReducer,
    prefs: prefsSlice,
    transaction: transactionSlice,
  },
});

export default store;
