import { createSlice } from "@reduxjs/toolkit";

import { persistReducer } from "redux-persist";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { RootState } from "../store/store";

interface AppState {
	bootstrapped: boolean;
}

const initialState: AppState = {
	bootstrapped: false
}

const appStateSlice = createSlice({
	name: "appState",
	initialState,
	reducers: {
		setAppBootstrapped: (state) => {
			state.bootstrapped = true;

		},

	},
});

export const appStateActions = appStateSlice.actions;

export const persistedAppStateReducer = persistReducer(
	{
		key: "_wallet_app_state__",
		storage: IonicStorageAdapter,
		version: 0
	},
	appStateSlice.reducer
);


export const selectIsAppBootstrapped = (s: RootState) => s.appState.bootstrapped
export const selectActiveIdentityId = (s: RootState) =>
	s.identitiesRegistry.activePubkey;
export const selectActiveIdentity = (s: RootState) => {
	const st = s.identitiesRegistry;
	return st.activePubkey ? st.entities[st.activePubkey] ?? null : null;
};



