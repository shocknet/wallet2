import {
	createSlice, createEntityAdapter, PayloadAction,
	EntityState,
} from "@reduxjs/toolkit";

import { persistReducer } from "redux-persist";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { RootState } from "../store/store";
import { IdentityType, type Identity } from "./types";



export const identitiesAdapter = createEntityAdapter<Identity, string>({
	selectId: i => i.pubkey,
	sortComparer: (a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0),
});

interface IdentitiesState extends EntityState<Identity, string> {
	activePubkey: string | null;
}


const initialState: IdentitiesState = identitiesAdapter.getInitialState({
	activePubkey: null
})



export const identitiesRegistrySlice = createSlice({
	name: "identityRegistry",
	initialState,
	reducers: {
		_createNewIdentity: (state, { payload }: PayloadAction<{
			identity: Identity
		}>) => {
			const { identity } = payload;
			if (state.entities[identity.pubkey]) return;
			identitiesAdapter.addOne(state, identity);

		},
		setActiveIdentity: (state, { payload }: PayloadAction<{ pubkey: string | null }>) => {
			if (payload.pubkey === null) {
				state.activePubkey = payload.pubkey;
				return;
			}
			const e = state.entities[payload.pubkey];
			if (!e) return;
			e.lastUsedAt = Date.now();
			state.activePubkey = payload.pubkey;
		},

		updateIdentityRelays: (state, { payload }: PayloadAction<{ pubkey: string, relays: string[] }>) => {
			const e = state.entities[payload.pubkey];
			if (e.type === IdentityType.SANCTUM) return;
			e.relays = payload.relays;
		},


		updateRegistryIdentityLabel: (state, { payload }: PayloadAction<{ pubkey: string; label: string }>) => {
			const e = state.entities[payload.pubkey];
			if (e) e.label = payload.label;
		},


		removeIdentity: (state, { payload }: PayloadAction<{ pubkey: string }>) => {
			if (state.activePubkey === payload.pubkey) return; // refuse
			identitiesAdapter.removeOne(state, payload.pubkey);
		},

	},
});

export const identitiesRegistryActions = identitiesRegistrySlice.actions;

export const persistedIdentitiesRegistryReducer = persistReducer(
	{
		key: "identities-registry",
		storage: IonicStorageAdapter,
		blacklist: ["activePubkey"],
		version: 0
	},
	identitiesRegistrySlice.reducer
);



export const identitiesSelectors = identitiesAdapter.getSelectors(
	(s: RootState) => s.identitiesRegistry
);
export const selectActiveIdentityId = (s: RootState) =>
	s.identitiesRegistry.activePubkey;
export const selectActiveIdentity = (s: RootState) => {
	const st = s.identitiesRegistry;
	return st.activePubkey ? st.entities[st.activePubkey] ?? null : null;
};




