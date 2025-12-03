
import { resetClientsCluster } from "@/Api/nostr";
import getIdentityNostrApi from "./helpers/identityNostrApi";
import { identitiesRegistryActions, selectActiveIdentityId } from "./slice";
import { persistor, type AppThunk } from "@/State/store/store";
import { getAllScopedPersistKeys, injectNewScopedReducer, removeScoped } from "../scoped/scopedReducer";
import { waitForRehydrateKeys } from "./middleware/switcher";
import { identityActions, selectIdentityDraft } from "../scoped/backups/identity/slice";
import { getDeviceId } from "@/constants";
import { Identity } from "./types";
import { identityDocDtag } from "./helpers/processDocs";
import { fetchNip78Event } from "./helpers/nostr";
import { sourcesActions } from "../scoped/backups/sources/slice";
import { getRemoteMigratedSources, SourceToMigrate } from "./helpers/migrateToIdentities";
import { appApi } from "../api/api";
import { onAddSourceDoc } from "../scoped/backups/sources/thunks";
import { SourceType } from "../scoped/common";
import { fetchAllSourcesHistory } from "../scoped/backups/sources/history/thunks";
import { identityLoaded, identityUnloaded } from "../listeners/actions";
import { createDeferred } from "@/lib/deferred";
import { appStateActions } from "../appState/slice";





export const LAST_ACTIVE_IDENTITY_PUBKEY_KEY = "__shockwallet_lai_";

export const switchIdentity = (pubkey: string, boot?: true): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const state = getState();
		const current = selectActiveIdentityId(state);


		if (!boot && current === pubkey) {
			return;
		}

		const existing = state.identitiesRegistry.entities[pubkey]
		if (!existing) {
			throw new Error("Identity does not exist");
		}

		const deviceId = getDeviceId();


		// Will throw if identity isn"t healthy (nostr extension issues, sanctum access issues)
		await getIdentityNostrApi(existing);

		if (!boot && current !== null) { // When it's a dynamic switch, tear down stuff nicely

			dispatch(appApi.util.resetApiState());


			await persistor.flush().catch(() => { });


			dispatch(identitiesRegistryActions.setActiveIdentity({ pubkey: null }));

			const deferred = createDeferred<void>();
			dispatch(identityUnloaded({ deferred }));
			await deferred;

			await resetClientsCluster(); // Tear down nostr layer

			removeScoped(dispatch);

		}


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



		setTimeout(() => {
			dispatch(fetchAllSourcesHistory());
		}, 200);
	}
}


export const createIdentity = (identity: Identity, localSources?: SourceToMigrate[]): AppThunk<Promise<{ foundBackup: boolean }>> => {
	return async (dispatch, getState) => {


		if (getState().identitiesRegistry.entities[identity.pubkey]) {
			throw new Error("This identity already exists.");
		}
		// Will throw if identity isn"t healthy (nostr extension issues, sanctum access issues)
		const identityApi = await getIdentityNostrApi(identity);

		dispatch(identitiesRegistryActions._createNewIdentity({ identity }));
		dispatch(appStateActions.setAppBootstrapped());

		await dispatch(switchIdentity(identity.pubkey));


		const identityDoc = await fetchNip78Event(identityApi, identityDocDtag);

		/*
		* This identity does not have an identity doc index.
		* However it may have legacy backup so we need to check that.
		*/

		if (identityDoc) return { foundBackup: true };

		const migratedSourceDocs = await getRemoteMigratedSources(identityApi, localSources);
		if (migratedSourceDocs.length) {
			for (const sourceDoc of migratedSourceDocs) {
				const { vanity_name, ...source } = sourceDoc


				await dispatch(onAddSourceDoc(source));
				dispatch(sourcesActions._createDraftDoc({ sourceId: source.source_id, draft: source }));

				if (vanity_name && source.type === SourceType.NPROFILE_SOURCE) {
					dispatch(sourcesActions.setVanityName({ sourceId: source.source_id, vanityName: vanity_name }));
				}
				await new Promise<void>(res => setTimeout(() => res(), 50)); // throttle source additions so publisher can pick them up
			}

			return { foundBackup: true };

		} else {
			return { foundBackup: false };
		}

	}
}

