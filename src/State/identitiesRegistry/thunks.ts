
import { resetClientsCluster } from "@/Api/nostr";
import getIdentityNostrApi from "./helpers/identityNostrApi";
import { identityLoaded, identitySwitchRequested, identityUnloaded, publisherFlushRequested } from "./middleware/actions";
import { identitiesRegistryActions, selectActiveIdentityId } from "./slice";
import { persistor, type AppThunk } from "@/State/store/store";
import { getAllScopedPersistKeys, injectNewScopedReducer, removeScoped } from "../scoped/scopedReducer";
import { waitForRehydrateKeys } from "./middleware/switcher";
import { identityActions, selectIdentityDraft } from "../scoped/backups/identity/slice";
import { getDeviceId } from "@/constants";
import { Identity, IdentityType } from "./types";
import { getIdentityDocDtag } from "./helpers/processDocs";
import { fetchNip78Event } from "./helpers/nostr";

import { sourcesActions } from "../scoped/backups/sources/slice";
import { getMigratedSources } from "./helpers/migrateToIdentities";


export const LAST_ACTIVE_IDENTITY_PUBKEY_KEY = "__shockwallet_lai";


interface args { pubkey: string; redirect?: (path: string, replace?: boolean) => void }
export const switchIdentity = ({ pubkey, redirect }: args): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const state = getState();
		const current = selectActiveIdentityId(state);
		if (current === pubkey) {
			redirect?.("/home", true);
			return;
		}

		const existing = state.identitiesRegistry.entities[pubkey]
		if (!existing) {
			throw new Error("Identity does not exist");
		}

		const deviceId = getDeviceId();


		// Will throw if identity isn"t healthy (nostr extension issues, sanctum access issues)
		await getIdentityNostrApi(existing);

		/*
		* Flush redux-persist and docs publisher middleware
		*/
		await persistor.flush().catch(() => { });
		dispatch(publisherFlushRequested());

		// wait a bit for publisher to finish?

		dispatch(identitiesRegistryActions.setActiveIdentity({ pubkey: null }));
		dispatch(identityUnloaded()); // Signal publisher and puller to stop

		await resetClientsCluster(); // Tear down nostr layer

		removeScoped(dispatch);

		injectNewScopedReducer(pubkey, dispatch);
		const keys = getAllScopedPersistKeys(pubkey);
		await waitForRehydrateKeys(Object.values(keys)); // Await redux persist rehydration of injected paths

		const draft = selectIdentityDraft(getState());

		// If no identity doc yet, init it. If a remote version comes they will converge naturally
		if (draft === undefined) {
			dispatch(identityActions.initIdentityDoc({ identity_pubkey: pubkey, by: deviceId }));
		}



		dispatch(identitiesRegistryActions.setActiveIdentity({ pubkey }));
		localStorage.setItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY, pubkey);
		dispatch(identityLoaded({ identity: existing }));
		dispatch(identitySwitchRequested({ pubkey }));

		redirect?.("/home", true);
	}
}


export const createIdentity = (identity: Identity): AppThunk<void> => {
	return async (dispatch, getState) => {
		// Will throw if identity isn"t healthy (nostr extension issues, sanctum access issues)
		const identityApi = await getIdentityNostrApi(identity);

		identitiesRegistryActions._createNewIdentity({ identity });

		await dispatch(switchIdentity({ pubkey: identity.pubkey }));


		const identityDoc = await fetchNip78Event(identityApi, getIdentityDocDtag(identity.pubkey));

		/*
		* This identity does not have an identity doc index.
		* However it may have legacy backup so we need to check that.
		*/
		if (!identityDoc) {
			const migratedSourceDocs = await getMigratedSources(identityApi);
			if (migratedSourceDocs.length > 0) {
				for (const source of migratedSourceDocs) {
					sourcesActions._createDraftDoc({ sourceId: source.source_id, draft: source });
				}
			}

		}
	}
}

