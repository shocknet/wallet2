import { createSlice } from '@reduxjs/toolkit';
import { syncRedux } from '../store';
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from '../../constants';
import { setNostrPrivateKey } from '../../Api/nostr';

export const storageKey = NOSTR_PRIVATE_KEY_STORAGE_KEY


export const mergeLogic = (serialLocal: string): string => {
	return serialLocal
}

const initialState: string = localStorage.getItem(storageKey) ?? "";


const generatedAssetsSlice = createSlice({
	name: storageKey,
	initialState,
	reducers: {
		setPrivateKey: (state) => {
			const key = setNostrPrivateKey();
			state = key;
			return state;
		},
	},
	extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return localStorage.getItem(storageKey) ?? "";
    })
  }
});

export const { setPrivateKey } = generatedAssetsSlice.actions;
export default generatedAssetsSlice.reducer;
