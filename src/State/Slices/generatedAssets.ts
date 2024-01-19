import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface GeneratedAssets {
  assets: string[]
}

const LIMIT = 5

const assetsyLocal = localStorage.getItem("generatedAssets");

const update = (value: GeneratedAssets) => {
  const save = JSON.stringify(value)
  localStorage.setItem("generatedAssets", save);
}

const initialState: GeneratedAssets = JSON.parse(assetsyLocal ?? "{}");


const generatedAssetsSlice = createSlice({
  name: 'generatedAssets',
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
  }
});

export const { addAsset } = generatedAssetsSlice.actions;
export default generatedAssetsSlice.reducer;
