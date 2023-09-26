import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface PrefsInterface {
    mempool: string,
    fiat: string,
}

const prefs = localStorage.getItem("prefs");

const update = (value: PrefsInterface) => {
  localStorage.setItem("prefs", JSON.stringify(value));
}

const initialState: PrefsInterface = JSON.parse(prefs??"{}");

const prefsSlice = createSlice({
  name: 'prefs',
  initialState,
  reducers: {
    setPrefs: (state, action: PayloadAction<PrefsInterface>) => {
        state = action.payload;
        update(state)
    },
  },
});

export const { setPrefs } = prefsSlice.actions;
export default prefsSlice.reducer;
