import { PayloadAction, createSlice } from '@reduxjs/toolkit';
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
const prefs = localStorage.getItem(storageKey);

const update = (value: PrefsInterface) => {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

const initialState: PrefsInterface = JSON.parse(prefs ?? '{"selected":"","mempoolUrl":"", "FiatUnit": {"url": "https://api.coinbase.com/v2/prices/BTC-USD/spot", "symbol": "$", "currency": "USD"}}');

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
