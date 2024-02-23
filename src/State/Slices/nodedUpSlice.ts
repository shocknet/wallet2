import { createSlice } from '@reduxjs/toolkit';
import { syncRedux } from '../store';

export const storageKey = "NODE_UP"


export const mergeLogic = (serialLocal: string): string => {
	return serialLocal
}





const update = (value: boolean) => {
	const save = JSON.stringify(value)
	localStorage.setItem(storageKey, save);
}

const initialState: boolean = JSON.parse(localStorage.getItem(storageKey) ?? "false");


const generatedAssetsSlice = createSlice({
	name: storageKey,
	initialState,
	reducers: {
		flagAsNodedUp: (state) => {
			state = true;
			update(state);
			return state;
		},
	},
	extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return JSON.parse(localStorage.getItem(storageKey) ?? "false");
    })
  }
});

export const { flagAsNodedUp } = generatedAssetsSlice.actions;
export default generatedAssetsSlice.reducer;
