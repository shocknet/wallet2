import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IdentityDocV0 } from "./schema";
import { bump, eqLww, mergeLww } from "../lww";
import { getPersistConfigKey, makeScopedPersistedReducer } from "@/State/persist/scope";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import type { RootState } from "@/State/store/store";
import { selectScopedStrict } from "../../stricScopedSelector";


type IdentityState = {
	base?: IdentityDocV0;
	draft?: IdentityDocV0;
	lastPublishedAt?: number;
	dirty: boolean;
};

const initialState: IdentityState = { dirty: false };

export const equalSet = (a: Set<string>, b: Set<string>) => {
	if (a.size !== b.size) return false;
	for (const v of a) if (!b.has(v)) return false;
	return true;
}
function equalIdentityDoc(a?: IdentityDocV0, b?: IdentityDocV0): boolean {
	if (!a || !b) return false;

	if (!eqLww(a.favorite_source_id, b.favorite_source_id)) return false;

	return true;
}

export const identitySlice = createSlice({
	name: "identity",
	initialState,
	reducers: {
		initIdentityDoc(
			state,
			a: PayloadAction<{ identity_pubkey: string; by: string }>
		) {
			if (state.draft) return;
			const { identity_pubkey, by } = a.payload;
			state.draft = {
				doc_type: "doc/shockwallet/identity_",
				schema_rev: 0,
				identity_pubkey,
				label: bump(undefined, "", by),                 // required by schema
				favorite_source_id: bump(undefined, null, by),  // start empty
				sources: [],
				created_at: Date.now(),
				bridge_url: bump(undefined, null, by),
			};
			state.dirty = true;
		},

		setFavoriteSource(
			state,
			a: PayloadAction<{ sourceId: string | null; by: string }>
		) {
			if (!state.draft) return;
			const cur = state.draft.favorite_source_id;
			if (cur.value !== a.payload.sourceId) {
				state.draft.favorite_source_id = bump(cur, a.payload.sourceId, a.payload.by);
				state.dirty = true;
			}
		},


		applyRemoteIdentity(state, a: PayloadAction<{ remote: IdentityDocV0 }>) {
			const r = a.payload.remote;

			// Immutable mismatch => ignore malicious/bogus event
			if (state.draft && state.draft.identity_pubkey !== r.identity_pubkey) return;
			if (state.base && state.base.identity_pubkey !== r.identity_pubkey) return;

			// First sight of identity data
			if (!state.draft && !state.base) {
				state.base = r;
				state.draft = r;
				state.dirty = false;
				return;
			}

			// Draft only (no base yet): create base by merging remote into draft
			if (!state.base && state.draft) {
				const d = state.draft;
				const basePrime: IdentityDocV0 = {
					...r,
					favorite_source_id: mergeLww(r.favorite_source_id, d.favorite_source_id),
				};
				state.base = basePrime;
				state.draft = basePrime;
				state.dirty = !equalIdentityDoc(basePrime, state.draft);
				return;
			}

			// Normal case: have base + draft
			if (state.base && state.draft) {
				const b = state.base;
				const d = state.draft;

				// 1) merge remote -> base
				const basePrime: IdentityDocV0 = {
					...b,
					identity_pubkey: b.identity_pubkey,
					favorite_source_id: mergeLww(b.favorite_source_id, r.favorite_source_id),
				};

				// 2) rebase local -> draft
				const draftPrime: IdentityDocV0 = {
					...basePrime,
					favorite_source_id: mergeLww(basePrime.favorite_source_id, d.favorite_source_id),
				};

				state.base = basePrime;
				state.draft = draftPrime;
				state.dirty = !equalIdentityDoc(basePrime, draftPrime);
			}
		},

		ackPublished(state, a: PayloadAction<{ when?: number }>) {
			if (!state.draft) return;
			state.base = state.draft;
			state.dirty = false;
			state.lastPublishedAt = a.payload.when ?? Date.now();
		},
	},
});

export const identityActions = identitySlice.actions;


export function getScopedIdentityReducer(identityPubkey: string) {
	return makeScopedPersistedReducer(
		identitySlice.reducer,
		"_identity",
		identityPubkey,
		{
			version: 0,
			storage: IonicStorageAdapter,
		},
	);
}

export function getScopedIdentityPersistKey(identityPubkey: string) {
	return getPersistConfigKey("identity", identityPubkey);
}



const selectIdentityState = (s: RootState) => selectScopedStrict(s).identity;

export const selectIdentityDraft = (s: RootState) => selectIdentityState(s).draft;
export const selectIdentityBase = (s: RootState) => selectIdentityState(s).base;
export const selectIsIdentityDirty = (s: RootState) => !!selectIdentityState(s).dirty;

export const selectFavoriteSourceId = (s: RootState) =>
	selectIdentityState(s).draft?.favorite_source_id.value ?? null;




