import {
	createSlice, createEntityAdapter, PayloadAction,
	EntityState,
	createSelector,
} from "@reduxjs/toolkit";

import { persistReducer, type PersistMigrate, type PersistedState } from "redux-persist";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { readSanctumTokens, writeSanctumTokens } from "./helpers/sanctumTokensStore";
import { RootState } from "../store/store";
import {
	IdentityType,
	type Identity,
	type LocalPrivateKeyStorage,
} from "./types";
import type { RuntimeIdentity } from "@/shell/types";
import type { TokensData } from "sanctum-sdk";



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
	lastActiveIdentityId: string | null;
}


const initialState: IdentitiesState = identitiesAdapter.getInitialState({
	topicIndexById: {},
	active: null,
	lastActiveIdentityId: null,
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
			if (!e || e.type === IdentityType.SANCTUM) return;
			e.relays = payload.relays;
		},


		updateRegistryIdentityLabel: (state, { payload }: PayloadAction<{ pubkey: string; label: string }>) => {
			const e = state.entities[payload.pubkey];
			if (e) e.label = payload.label;
		},
		setLocalSecretStorage: (
			state,
			{ payload }: PayloadAction<{ pubkey: string; localSecret: LocalPrivateKeyStorage }>
		) => {
			const e = state.entities[payload.pubkey];
			if (!e || e.type !== IdentityType.LOCAL_KEY) return;
			e.localSecret = payload.localSecret;
		},
		markSanctumReauthRequired: (state, { payload }: PayloadAction<{ pubkey: string; reason?: string }>) => {
			const e = state.entities[payload.pubkey];
			if (!e || e.type !== IdentityType.SANCTUM) return;
			e.reauthReason = payload.reason ?? "Session expired or invalid";
		},
		clearSanctumReauthRequired: (state, { payload }: PayloadAction<{ pubkey: string }>) => {
			const e = state.entities[payload.pubkey];
			if (!e || e.type !== IdentityType.SANCTUM) return;
			e.reauthReason = undefined;
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
		setLastActiveIdentityId: (state, { payload }: PayloadAction<{ pubkey: string }>) => {
			state.lastActiveIdentityId = payload.pubkey;
		},
		clearLastActiveIdentityId: (state) => {
			state.lastActiveIdentityId = null;
		},



		/* Active identity */
		setActiveIdentityRuntime: (state, action: PayloadAction<{ identity: RuntimeIdentity }>) => {
			state.active = action.payload.identity;
		},
		clearActiveIdentityRuntime: (state) => {
			state.active = null;
		},
		updateActiveIdentityRelays: (
			state,
			action: PayloadAction<{ pubkey: string; relays: string[] }>
		) => {
			if (!state.active || state.active.pubkey !== action.payload.pubkey) return;
			if (state.active.type === IdentityType.SANCTUM) return;
			state.active.relays = action.payload.relays;
		},
		updateActiveIdentityLabel: (
			state,
			action: PayloadAction<{ pubkey: string; label: string }>
		) => {
			if (!state.active || state.active.pubkey !== action.payload.pubkey) return;
			state.active.label = action.payload.label;
		},
		setActiveWrappedDataKeyCiphertext: (
			state,
			action: PayloadAction<{ pubkey: string; wrappedDataKeyCiphertext: string }>
		) => {
			if (!state.active || state.active.pubkey !== action.payload.pubkey) return;
			state.active.wrappedDataKeyCiphertext = action.payload.wrappedDataKeyCiphertext;
		},
		setActiveSanctumReauthRequired: (
			state,
			action: PayloadAction<{ pubkey: string; reason?: string | null }>
		) => {
			if (!state.active || state.active.type !== IdentityType.SANCTUM) return;
			if (state.active.pubkey !== action.payload.pubkey) return;
			state.active.reauthReason = action.payload.reason ?? "Session expired or invalid";
		},
		clearActiveSanctumReauthRequired: (
			state,
			action: PayloadAction<{ pubkey: string }>
		) => {
			if (!state.active || state.active.type !== IdentityType.SANCTUM) return;
			if (state.active.pubkey !== action.payload.pubkey) return;
			state.active.reauthReason = null;
		},

	},
});

export const identitiesRegistryActions = identitiesRegistrySlice.actions;

export const identitiesRegistryPersistKey = "_identities-registry";

// A tab still on the old build can re-save the old format after this migration ran,
// so the old copy may be stale; overwriting a newer refresh token would end the session.
async function keepNewerSanctumTokens(pubkey: string, legacy: TokensData) {
	const onDisk = await readSanctumTokens(pubkey);
	if (onDisk && onDisk.expires_at >= legacy.expires_at) return;
	await writeSanctumTokens(pubkey, legacy);
}

async function migrateSanctumTokensToDisk(
	state: NonNullable<PersistedState> & IdentitiesState,
) {
	const entities = { ...state.entities };
	for (const id of Object.keys(entities)) {
		const identity = entities[id];
		if (!identity || identity.type !== IdentityType.SANCTUM) continue;
		if (!("sanctumTokens" in identity)) continue;

		const tokens = identity.sanctumTokens;
		if (
			tokens &&
			typeof tokens === "object" &&
			"storage" in tokens &&
			tokens.storage === "inline" &&
			"tokensData" in tokens &&
			tokens.tokensData
		) {
			try {
				await keepNewerSanctumTokens(identity.pubkey, tokens.tokensData as TokensData);
			} catch {
				// The session can be signed in again.
			}
		}

		const { sanctumTokens: _sanctumTokens, ...rest } = identity;
		entities[id] = rest;
	}

	return { ...state, entities };
}

const migrateIdentitiesRegistry: PersistMigrate = async (state, currentVersion) => {
	if (!state) return undefined;
	const inboundVersion = state._persist?.version ?? -1;
	if (inboundVersion >= currentVersion) return state;
	return migrateSanctumTokensToDisk(state as NonNullable<PersistedState> & IdentitiesState);
};

export const persistedIdentitiesRegistryReducer = persistReducer(
	{
		key: identitiesRegistryPersistKey,
		storage: IonicStorageAdapter,
		blacklist: ["active"],
		version: 1,
		migrate: migrateIdentitiesRegistry,
	},
	identitiesRegistrySlice.reducer
);





export const identitiesSelectors = identitiesAdapter.getSelectors(
	(s: RootState) => s.identitiesRegistry
);

export const selectIdentities = createSelector(
	[
		identitiesSelectors.selectAll,
	],
	(identities) => identities
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
export const selectLastActiveIdentityId = (s: RootState) => s.identitiesRegistry.lastActiveIdentityId;

export const selectTopicIndexFromRegistry = (s: RootState, topicId: string) => s.identitiesRegistry.topicIndexById[topicId] ?? null;
