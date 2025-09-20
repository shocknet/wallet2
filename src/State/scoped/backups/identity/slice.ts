import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IdentityDocV0 } from "./schema";
import { bump, eqLww, mergeLww } from "../lww";
import { getPersistConfigKey, makeScopedPersistedReducer } from "@/State/persist/scope";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import type { RootState } from "@/State/store/store";
import { selectScopedStrict } from "../../stricScopedSelector";


const dedupe = (arr: string[]) => Array.from(new Set(arr));

type IdentityState = {
	base?: IdentityDocV0;
	draft?: IdentityDocV0;
	lastPublishedAt?: number;
	dirty: boolean;
};

const initialState: IdentityState = { dirty: false };

function equalIdentityDoc(a?: IdentityDocV0, b?: IdentityDocV0): boolean {
	if (!a || !b) return false;

	if (!eqLww(a.label, b.label)) return false;
	if (!eqLww(a.favorite_source_id, b.favorite_source_id)) return false;
	if (!eqLww(a.bridge_url, b.bridge_url)) return false;
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
				doc_type: "doc/shockwallet/identity",
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

		updateIdentityLabel(state, a: PayloadAction<{ label?: string; by: string }>) {
			if (!state.draft) return;
			const cur = state.draft.label;
			if (a.payload.label !== undefined && cur.value !== a.payload.label) {
				state.draft.label = bump(cur, a.payload.label, a.payload.by);
				state.dirty = true;
			}
		},

		setFavoriteSource(
			state,
			a: PayloadAction<{ sourceId: string | null; by: string }>
		) {
			if (!state.draft) return;
			const cur = state.draft.favorite_source_id;
			if (!cur || cur.value !== a.payload.sourceId) {
				state.draft.favorite_source_id = bump(cur, a.payload.sourceId, a.payload.by);
				state.dirty = true;
			}
		},

		setBridgeUrl(
			state,
			a: PayloadAction<{ url: string | null; by: string }>
		) {
			if (!state.draft) return;
			const cur = state.draft.bridge_url;
			if (!cur || cur.value !== a.payload.url) {
				state.draft.bridge_url = bump(cur, a.payload.url, a.payload.by);
				state.dirty = true;
			}
		},

		addSourceId(state, a: PayloadAction<{ sourceId: string }>) {
			if (!state.draft) return;
			const next = dedupe([...state.draft.sources, a.payload.sourceId]);
			if (next.length !== state.draft.sources.length) {
				state.draft.sources = next;
				state.dirty = true;
			}
		},

		removeSourceId(state, a: PayloadAction<{ sourceId: string }>) {
			if (!state.draft) return;
			const next = state.draft.sources.filter(id => id !== a.payload.sourceId);
			if (next.length !== state.draft.sources.length) {
				state.draft.sources = next;
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
					label: mergeLww(r.label, d.label),
					favorite_source_id: mergeLww(r.favorite_source_id, d.favorite_source_id),
					bridge_url: mergeLww(r.bridge_url, d.bridge_url),
					sources: [...new Set([...r.sources, ...d.sources])],
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
					label: mergeLww(b.label, r.label),
					favorite_source_id: mergeLww(b.favorite_source_id, r.favorite_source_id),
					bridge_url: mergeLww(b.bridge_url, r.bridge_url),
					sources: [...new Set([...b.sources, ...r.sources])],
				};

				// 2) rebase local -> draft
				const draftPrime: IdentityDocV0 = {
					...basePrime,
					label: mergeLww(basePrime.label, d.label),
					favorite_source_id: mergeLww(basePrime.favorite_source_id, d.favorite_source_id),
					bridge_url: mergeLww(basePrime.bridge_url, d.bridge_url),
					sources: [...new Set([...basePrime.sources, ...d.sources])],
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
		"identity",
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

export const selectBridgeUrl = (s: RootState) =>
	selectIdentityState(s).draft?.bridge_url.value ?? null;


