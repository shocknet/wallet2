import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { createMigrate, persistReducer } from "redux-persist";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { RootState } from "../store/store";

export type Theme = "light" | "dark" | "system";
interface AppState {
	bootstrapped: boolean;
	theme: Theme
}


const initialState: AppState = {
	bootstrapped: false,
	theme: "system"
}

const appStateSlice = createSlice({
	name: "appState",
	initialState,
	reducers: {
		setAppBootstrapped: (state) => {
			state.bootstrapped = true;

		},

		setTheme: (state, a: PayloadAction<{ theme: Theme }>) => {
			state.theme = a.payload.theme;
		}
	},
});

export const appStateActions = appStateSlice.actions;

const migrations = {
	1: (state: AppState): AppState => {
		return {
			...state,
			theme: "system"
		}
	}
}

export const persistedAppStateReducer = persistReducer(
	{
		key: "_wallet_app_state__",
		storage: IonicStorageAdapter,
		version: 1,
		// @ts-expect-error redux-persist typing issue
		migrate: createMigrate(migrations, { debug: false })
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

export const selectTheme = (s: RootState) => s.appState.theme;



