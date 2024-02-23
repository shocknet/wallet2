import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { syncRedux } from '../store';

export const storageKey = "generatedAssets"
interface GeneratedAssets {
	assets: string[]
}

export const mergeLogic = (serialLocal: string): string => {
	return serialLocal
}

const LIMIT = 5

const assetsyLocal = localStorage.getItem(storageKey);

const update = (value: GeneratedAssets) => {
	const save = JSON.stringify(value)
	localStorage.setItem(storageKey, save);
}

const initialState: GeneratedAssets = JSON.parse(assetsyLocal ?? "{}");


const generatedAssetsSlice = createSlice({
	name: storageKey,
	initialState,
	reducers: {
		addAsset: (state, action: PayloadAction<{ asset: string }>) => {
			const { asset } = action.payload;
			if (!state.assets) {
				state.assets = [];
			}
			if (state.assets.includes(asset)) return;
			const array = [...state.assets];
			array.unshift(asset);
			// fixed array so it's not a lot of storage space
			if (array.length > LIMIT) {
				array.splice(LIMIT, array.length - LIMIT);
			}
			state.assets = array;

			update(state);
		},
	},
	extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    })
  }
});

export const { addAsset } = generatedAssetsSlice.actions;
export default generatedAssetsSlice.reducer;
