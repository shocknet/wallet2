import { PayloadAction, createSlice } from '@reduxjs/toolkit';
type FeeOptions = "asap" | "avg" | "eco" | ""
interface PrefsInterface {
  mempoolUrl: string,
  BTCUSDUrl: string,
  selected: FeeOptions
  debugMode?: boolean
}

const prefs = localStorage.getItem("prefs");

const update = (value: PrefsInterface) => {
  localStorage.setItem("prefs", JSON.stringify(value));
}

const initialState: PrefsInterface = JSON.parse(prefs ?? '{"selected":"","mempoolUrl":"", "BTCUSDUrl":""}');

const prefsSlice = createSlice({
  name: 'prefs',
  initialState,
  reducers: {
    setPrefs: (state, action: PayloadAction<PrefsInterface>) => {
      state.mempoolUrl = action.payload.mempoolUrl;
      state.BTCUSDUrl = action.payload.BTCUSDUrl
      state.selected = action.payload.selected
      update(state)
    },
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload
      update(state)
    }
  },
});

export const { setPrefs, setDebugMode } = prefsSlice.actions;
export default prefsSlice.reducer;
