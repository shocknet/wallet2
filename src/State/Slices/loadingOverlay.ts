import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface LoadingOverlay {
  loadingMessage: string
}



const initialState: LoadingOverlay = { loadingMessage: "" };


const loadingOverlaySlice = createSlice({
  name: 'loadingOverlay',
  initialState,
  reducers: {
		toggleLoading: (state, action: PayloadAction<{loadingMessage: string}>) => {
			return { loadingMessage: action.payload.loadingMessage }
		},
  }
});

export const { toggleLoading } = loadingOverlaySlice.actions;
export default loadingOverlaySlice.reducer;
