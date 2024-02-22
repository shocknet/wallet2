import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import loadInitialState, { MigrationFunction, applyMigrations, getStateAndVersion } from './migrations';
import { syncRedux } from '../store';
type FeeOptions = "asap" | "avg" | "eco" | ""
type FiatCurrencyUrl = {
  url: string
  symbol?: string
  currency: string
}
interface PrefsInterface {
  mempoolUrl: string
  FiatUnit: FiatCurrencyUrl
  selected: FeeOptions
  debugMode?: boolean
}

export const storageKey = "prefs"
export const VERSION = 1;
export const migrations: Record<number, MigrationFunction<PrefsInterface>> = {
  // the Fiaturl to FiatUni migration
  1: (state) => {
    console.log("running migration v1 of prefs")
    if (state.Fiaturl) {
      const { Fiaturl, ...rest } = state;
      return { ...rest, FiatUnit: Fiaturl };
    } else {
      return state
    }
    
  },
};



export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  /* const local = JSON.parse(serialLocal) as PrefsInterface
  const remote = JSON.parse(serialRemote) */
  const local = getStateAndVersion(serialLocal);
  const remote = getStateAndVersion(serialRemote);

  const migratedRemote = applyMigrations(remote.state, remote.version, migrations);
  const migratedLocal = applyMigrations(local.state, local.version, migrations);

  const merged: PrefsInterface = {
    mempoolUrl: migratedLocal.mempoolUrl || migratedRemote.mempoolUrl,
    FiatUnit: migratedLocal.FiatUnit || migratedRemote.FiatUnit,
    selected: migratedLocal.selected || migratedRemote.selected,
    debugMode: migratedLocal.debugMode,
  }
  return JSON.stringify({
    version: VERSION,
    data: merged
  });
  
}



const update = (value: PrefsInterface) => {
  const stateToSave = {
    version: VERSION,
    data: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}



const initialState: PrefsInterface = loadInitialState(
  storageKey,
  '{"selected":"","mempoolUrl":"", "FiatUnit": {"url": "https://api.coinbase.com/v2/prices/BTC-USD/spot", "symbol": "$", "currency": "USD"}}',
  migrations,
  update
);

const prefsSlice = createSlice({
  name: storageKey,
  initialState,
  reducers: {
    setPrefs: (state, action: PayloadAction<PrefsInterface>) => {
      state.mempoolUrl = action.payload.mempoolUrl;
      state.FiatUnit = action.payload.FiatUnit
      state.selected = action.payload.selected
      update(state)
    },
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload
      update(state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return loadInitialState(
        storageKey,
        '{"selected":"","mempoolUrl":"", "FiatUnit": {"url": "https://api.coinbase.com/v2/prices/BTC-USD/spot", "symbol": "$", "currency": "USD"}}',
        migrations,
        update
      );
    })
  }
});

export const { setPrefs, setDebugMode } = prefsSlice.actions;
export default prefsSlice.reducer;
