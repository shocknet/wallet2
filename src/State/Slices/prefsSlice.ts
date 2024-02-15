import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import applyMigrations, { MigrationFunction } from './migrations';
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
export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  const local = JSON.parse(serialLocal) as PrefsInterface
  const remote = JSON.parse(serialRemote) as PrefsInterface
  const merged: PrefsInterface = {
    mempoolUrl: local.mempoolUrl || remote.mempoolUrl,
    FiatUnit: local.FiatUnit || remote.FiatUnit,
    selected: local.selected || remote.selected,
    debugMode: local.debugMode,
  }
  return JSON.stringify(merged)
  
}


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

const loadInitialState = () => {
  const storedData = localStorage.getItem(storageKey);
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    let migrationResult: any = null;
    if (parsedData.version === undefined) {
      migrationResult = applyMigrations(parsedData, 0, migrations)
    } else {
      migrationResult = applyMigrations(parsedData.prefs, parsedData.version, migrations)
    }
    update(migrationResult)
    return migrationResult;
  }
  return JSON.parse('{"selected":"","mempoolUrl":"", "FiatUnit": {"url": "https://api.coinbase.com/v2/prices/BTC-USD/spot", "symbol": "$", "currency": "USD"}}');
};

const update = (value: PrefsInterface) => {
  const stateToSave = {
    version: VERSION,
    prefs: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}



const initialState: PrefsInterface = loadInitialState()

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
});

export const { setPrefs, setDebugMode } = prefsSlice.actions;
export default prefsSlice.reducer;
