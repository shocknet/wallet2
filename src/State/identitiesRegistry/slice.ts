import {
	createSlice, createEntityAdapter, PayloadAction,
	EntityState,
	createSelector,
} from "@reduxjs/toolkit";

import { persistReducer } from "redux-persist";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { RootState } from "../store/store";
import {
	IdentityType,
	isSecureIdentity,
	RuntimeIdentity,
	type Identity,
	type LocalPrivateKeyStorage,
	type SanctumTokensStorage,
	type WrappedDataKeyStorage,
} from "./types";
import { TokensData } from "sanctum-sdk";



export const identitiesAdapter = createEntityAdapter<Identity, string>({
	selectId: i => i.pubkey,
	sortComparer: (a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0),
});

export type TopicIndexEntry = {
	identityId: string;
	sourceId: string;
};
export interface IdentitiesState extends EntityState<Identity, string> {
	topicIndexById: Record<string, TopicIndexEntry>;
	active: RuntimeIdentity | null;
}


const initialState: IdentitiesState = identitiesAdapter.getInitialState({
	topicIndexById: {},
	active: null,
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
		_upsertIdentity: (state, { payload }: PayloadAction<{ identity: Identity }>) => {
			identitiesAdapter.upsertOne(state, payload.identity);
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
		setIdentityWrappedDataKeyStorage: (
			state,
			{ payload }: PayloadAction<{ pubkey: string; wrappedDataKey: WrappedDataKeyStorage }>
		) => {
			const e = state.entities[payload.pubkey];
			if (!e) return;
			e.wrappedDataKey = payload.wrappedDataKey;
		},
		setLocalSecretStorage: (
			state,
			{ payload }: PayloadAction<{ pubkey: string; localSecret: LocalPrivateKeyStorage }>
		) => {
			const e = state.entities[payload.pubkey];
			if (!e || e.type !== IdentityType.LOCAL_KEY) return;
			e.localSecret = payload.localSecret;
		},
		setSanctumTokensStorage: (
			state,
			{ payload }: PayloadAction<{ pubkey: string; sanctumTokens: SanctumTokensStorage }>
		) => {
			const e = state.entities[payload.pubkey];
			if (!e || e.type !== IdentityType.SANCTUM) return;
			e.sanctumTokens = payload.sanctumTokens;
			e.reauthReason = undefined;
		},

		markSanctumReauthRequired: (state, { payload }: PayloadAction<{ pubkey: string; reason?: string }>) => {
			const e = state.entities[payload.pubkey];
			if (!e || e.type !== IdentityType.SANCTUM) return;
			e.reauthReason = payload.reason ?? "Session expired or invalid";
		},
		clearSanctumTokensData: (state, { payload }: PayloadAction<{ pubkey: string }>) => {
			const e = state.entities[payload.pubkey];
			if (!e || e.type !== IdentityType.SANCTUM) return;
			e.sanctumTokens = undefined;
		},
		setTopicIdIndex: (state, { payload }: PayloadAction<{ topicId: string; sourceId: string, identityId: string }>) => {
			state.topicIndexById[payload.topicId] = { identityId: payload.identityId, sourceId: payload.sourceId };
		},
		removeTopicIdFromIndex: (state, { payload }: PayloadAction<{ topicId: string }>) => {
			delete state.topicIndexById[payload.topicId];
		},
		removeIdentity: (state, { payload }: PayloadAction<{ pubkey: string }>) => {
			identitiesAdapter.removeOne(state, payload.pubkey);
			for (const [topicId, entry] of Object.entries(state.topicIndexById)) {
				if (entry.identityId === payload.pubkey) {
					delete state.topicIndexById[topicId];
				}
			}
		},



		/* Active identity */
		setActiveIdentityRuntime: (state, action: PayloadAction<{ identity: RuntimeIdentity }>) => {
			state.active = action.payload.identity;
		},
		clearActiveIdentityRuntime: (state) => {
			state.active = null;
		},
		/* Sanctum specific for tokens writes */
		setActiveSanctumTokensData: (
			state,
			action: PayloadAction<{ pubkey: string; tokensData: TokensData }>
		) => {
			if (!state.active || state.active.type !== IdentityType.SANCTUM) return;
			if (state.active.pubkey !== action.payload.pubkey) return;
			state.active.tokensData = action.payload.tokensData;
			state.active.reauthReason = null;
		},
		clearActiveSanctumTokensData: (
			state,
			action: PayloadAction<{ pubkey: string }>
		) => {
			if (!state.active || state.active.type !== IdentityType.SANCTUM) return;
			if (state.active.pubkey !== action.payload.pubkey) return;
			state.active.tokensData = null;
		},
		setActiveSanctumReauthRequired: (
			state,
			action: PayloadAction<{ pubkey: string; reason?: string | null }>
		) => {
			if (!state.active || state.active.type !== IdentityType.SANCTUM) return;
			if (state.active.pubkey !== action.payload.pubkey) return;
			state.active.reauthReason = action.payload.reason ?? "Session expired or invalid";
		},

	},
});

export const identitiesRegistryActions = identitiesRegistrySlice.actions;

export const identitiesRegistryPersistKey = "_identities-registry";

export const persistedIdentitiesRegistryReducer = persistReducer(
	{
		key: identitiesRegistryPersistKey,
		storage: IonicStorageAdapter,
		blacklist: ["active"],
		version: 0
	},
	identitiesRegistrySlice.reducer
);



export const identitiesSelectors = identitiesAdapter.getSelectors(
	(s: RootState) => s.identitiesRegistry
);

export const selectSecureIdentities = createSelector(
	[
		identitiesSelectors.selectEntities,
	],
	(entities) => Object.values(entities).filter(isSecureIdentity)
)


export const selectIdentityByPubkey = createSelector(
	[
		identitiesSelectors.selectEntities,
		(_: RootState, pubkey: string) => pubkey
	],
	(entities, pubkey) => entities[pubkey] ?? null
)

export const selectTopicResolutionFromRegistry = createSelector(
	[
		(s: RootState) => s.identitiesRegistry.topicIndexById,
		(_: RootState, topicId: string) => topicId
	],
	(index, topicId) => index[topicId] ?? null
)



export const selectActiveIdentity = (s: RootState) => s.identitiesRegistry.active;
export const selectActiveRuntimeLocalPrivateKey = (s: RootState) =>
	s.identitiesRegistry.active?.type === IdentityType.LOCAL_KEY
		? s.identitiesRegistry.active.privateKey
		: null;
export const selectActiveRuntimeSanctumTokensData = (s: RootState) =>
	s.identitiesRegistry.active?.type === IdentityType.SANCTUM
		? s.identitiesRegistry.active.tokensData
		: null;
