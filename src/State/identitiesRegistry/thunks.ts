
import { resetClientsCluster } from "@/Api/nostr";
import getIdentityNostrApi from "./helpers/identityNostrApi";
import { identitiesRegistryActions } from "./slice";
import { persistor, type AppThunk } from "@/State/store/store";
import { injectNewScopedReducer, removeScoped } from "../scope/inject";
import { waitForRehydrateKeys } from "./middleware/switcher";
import { getScopedIdentityPersistKey, identityActions, selectIdentityDraft } from "@/State/scoped/backups/identity/slice";
import { getDeviceId } from "@/constants";
import { IdentityType } from "./types";
import type { RuntimeIdentity } from "@/shell/types";
import { identityDocDtag } from "./helpers/processDocs";
import { fetchNip78Event } from "./helpers/nostr";
import { getScopedSourcesPersistKey } from "@/State/scoped/backups/sources/slice";
import { appApi } from "../api/api";
import { identityLoaded, identityUnloaded } from "../listeners/actions";
import { createDeferred } from "@/lib/deferred";
import { appStateActions } from "../appState/slice";
import dLogger from "@/Api/helpers/debugLog";
import { unwrapDataKeyWithNip44 } from "./helpers/datakey";
import { clearSanctumIdentitySdk } from "./helpers/sanctumIdentitySdkManager";
import {
	deleteIdentityPersistedData,
} from "./helpers/deleteIdentityStorage";
import {
	applyMigratedSourceDocs,
	getSourcesFromLegacyRemoteBackup,
	migrateLegacySourcesToDocs,
} from "../../shell/migrations/deviceToIdentities/legacySources";
import {
	provisionIdentity,
	type CreateIdentityInput,
} from "./helpers/provisionIdentity";






export const LAST_ACTIVE_IDENTITY_PUBKEY_KEY = "__shockwallet_lai_";


const unloadActiveIdentityIfPresent = (): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const state = getState();
		const currentIdentity = state.identitiesRegistry.active

		if (!currentIdentity || !state.scoped) {
			return;
		}

		const log = dLogger.withContext({
			procedure: "unload-active-identity",
			data: { pubkey: currentIdentity.pubkey },
		});
		log.info("started");

		dispatch(appApi.util.resetApiState());
		await persistor.flush().catch(() => { });

		dispatch(identitiesRegistryActions.clearActiveIdentityRuntime());
		dLogger.removeIdentityContext();

		const deferred = createDeferred<void>();
		dispatch(identityUnloaded({ deferred }));
		await deferred;

		await resetClientsCluster();

		if (currentIdentity.type === IdentityType.SANCTUM) {
			clearSanctumIdentitySdk(currentIdentity.pubkey);
		}
		removeScoped(dispatch);

		log.info("completed");
	};
};

export const switchIdentity = (toIdentity: RuntimeIdentity): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {

		const log = dLogger.withContext({
			procedure: "switch-identity",
			data: { pubkey: toIdentity.pubkey }
		});

		log.info("started");

		const state = getState();
		const currentIdentity = state.identitiesRegistry.active;


		if (currentIdentity?.pubkey === toIdentity.pubkey) {
			log.debug("aborted-same-pubkey");
			return;
		}

		const fromRegistry = state.identitiesRegistry.entities[toIdentity.pubkey]
		if (!fromRegistry) {
			log.error("switch-to-nonexisting-identity");
			throw new Error("Identity does not exist");
		}

		const deviceId = getDeviceId();

		// Will throw if identity isn"t healthy (nostr extension issues, sanctum session issues)
		const identityNostrApi = await getIdentityNostrApi(toIdentity);


		const unwrappedDataKey = await unwrapDataKeyWithNip44({
			pubkey: toIdentity.pubkey,
			api: identityNostrApi,
			wrappedDataKeyCiphertext: toIdentity.wrappedDataKeyCiphertext,
		});

		await dispatch(unloadActiveIdentityIfPresent());

		injectNewScopedReducer(toIdentity.pubkey, dispatch, unwrappedDataKey);
		const keys = [getScopedIdentityPersistKey(toIdentity.pubkey), getScopedSourcesPersistKey(toIdentity.pubkey)];
		await waitForRehydrateKeys(keys); // Await redux persist rehydration of injected paths

		const draft = selectIdentityDraft(getState());

		// If no identity doc yet, init it. If a remote version comes they will converge naturally
		if (draft === undefined) {
			log.debug("init-identity-doc");
			dispatch(identityActions.initIdentityDoc({ identity_pubkey: toIdentity.pubkey, by: deviceId }));
		}

		dispatch(identitiesRegistryActions.setActiveIdentityRuntime({ identity: toIdentity }));
		dispatch(identitiesRegistryActions.setLastActiveIdentityId({ pubkey: toIdentity.pubkey }));
		dLogger.setIdentityContext({ identityPubkey: toIdentity.pubkey, identityType: toIdentity.type });
		dispatch(identityLoaded({ identity: toIdentity }));

	}
}

export const deleteIdentity = (pubkey: string): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const log = dLogger.withContext({
			procedure: "delete-identity",
			data: { pubkey },
		});

		const state = getState();
		const identity = state.identitiesRegistry.entities[pubkey];
		if (!identity) {
			log.error("delete-nonexisting-identity");
			throw new Error("Identity does not exist");
		}

		if (state.identitiesRegistry.active?.pubkey === pubkey) {
			log.error("delete-active-identity-blocked");
			throw new Error("Cannot delete the active identity");
		}

		await deleteIdentityPersistedData(identity);
		dispatch(identitiesRegistryActions.removeIdentity({ pubkey }));

		if (localStorage.getItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY) === pubkey) {
			localStorage.removeItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);
		}

		await persistor.flush().catch(() => { });
		log.info("completed");
	};
};

export const createIdentity = (
	input: CreateIdentityInput,
): AppThunk<Promise<{ foundBackup: boolean; identityId: string }>> => {
	return async (dispatch, getState) => {
		const { identity, runtime: runtimeIdentity } = await provisionIdentity(input);

		const log = dLogger.withContext({
			procedure: "create-identity",
			data: { pubkey: identity.pubkey, identityType: identity.type },
		});
		if (getState().identitiesRegistry.entities[identity.pubkey]) {
			log.error("identity-already-exists");
			throw new Error("This identity already exists.");
		}
		const identityApi = await getIdentityNostrApi(runtimeIdentity, true);

		dispatch(identitiesRegistryActions._createNewIdentity({ identity }));
		dispatch(appStateActions.setAppBootstrapped());

		await dispatch(switchIdentity(runtimeIdentity));

		const identityDoc = await fetchNip78Event(identityApi, identityDocDtag);

		if (identityDoc) {
			log.info("found-remote-identity-doc");
			return { foundBackup: true, identityId: runtimeIdentity.pubkey };
		}

		const remoteLegacySources = await getSourcesFromLegacyRemoteBackup(identityApi);
		const legacySourceDocs = migrateLegacySourcesToDocs(remoteLegacySources);

		if (legacySourceDocs.length) {
			log.info("importing-legacy-sources", { data: { count: legacySourceDocs.length } });
			applyMigratedSourceDocs(dispatch, legacySourceDocs);
			return { foundBackup: true, identityId: runtimeIdentity.pubkey };
		}

		return { foundBackup: false, identityId: runtimeIdentity.pubkey };
	};
};
