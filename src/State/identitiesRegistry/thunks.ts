
import { resetClientsCluster } from "@/Api/nostr";
import getIdentityNostrApi, {
	adaptSanctumDKApiToIdentityNostrApi,
	getLocalKeysIdentityApi,
	getNostrExtensionIdentityApi,
} from "./helpers/identityNostrApi";
import { identitiesRegistryActions } from "./slice";
import { persistor, type AppThunk } from "@/State/store/store";
import { injectNewScopedReducer, removeScoped } from "../scope/inject";
import { waitForRehydrateKeys } from "./middleware/switcher";
import { getScopedIdentityPersistKey, identityActions, selectIdentityDraft } from "@/State/scoped/backups/identity/slice";
import { getDeviceId, SANCTUM_URL } from "@/constants";
import { Identity, IdentityType, isSecureIdentity, RuntimeIdentity } from "./types";
import { identityDocDtag } from "./helpers/processDocs";
import { fetchNip78Event } from "./helpers/nostr";
import { getScopedSourcesPersistKey, sourcesActions } from "@/State/scoped/backups/sources/slice";
import { getRemoteMigratedSources, SourceToMigrate } from "./helpers/migrateToIdentities";
import { appApi } from "../api/api";
import { SourceType } from "../scoped/backups/sources/schema";
import { identityLoaded, identityUnloaded } from "../listeners/actions";
import { createDeferred } from "@/lib/deferred";
import { appStateActions } from "../appState/slice";
import dLogger from "@/Api/helpers/debugLog";
import {
	toLocalPrivateKeyStorage,
	toSanctumTokensStorage,
	toWrappedDataKeyStorage,
} from "./helpers/platformSecretStorage";
import { generateAndWrapDataKey, unwrapDataKeyWithNip44 } from "./helpers/datakey";
import { createSanctumDK, type TokensData } from "sanctum-sdk";
import { clearSanctumIdentitySdk } from "./helpers/sanctumIdentitySdkManager";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { unlockIdentity } from "./helpers/unlockIdentity";
import {
	deleteIdentityPersistedData,
} from "./helpers/deleteIdentityStorage";
export {
	setIdentityWrappedDataKey,
	setIdentityLocalPrivateKey,
	setIdentitySanctumTokensData,
} from "./helpers/platformSecretStorage";





export const LAST_ACTIVE_IDENTITY_PUBKEY_KEY = "__shockwallet_lai_";

export const switchIdentity = (toIdentity: RuntimeIdentity, boot?: boolean): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {

		const log = dLogger.withContext({
			procedure: "switch-identity",
			data: { pubkey: toIdentity.pubkey, boot }
		});

		log.info("started");

		const state = getState();
		const currentIdentity = state.identitiesRegistry.active;


		if (!boot && currentIdentity?.pubkey === toIdentity.pubkey) {
			log.debug("aborted-same-pubkey");
			return;
		}

		const fromRegistry = state.identitiesRegistry.entities[toIdentity.pubkey]
		if (!fromRegistry) {
			log.error("switch-to-nonexisting-identity");
			throw new Error("Identity does not exist");
		}
		if (!isSecureIdentity(fromRegistry)) {
			log.error("switch-to-unmigrated-identity");
			throw new Error("Identity has not completed secure migration");
		}

		const deviceId = getDeviceId();

		// Will throw if identity isn"t healthy (nostr extension issues, sanctum session issues)
		const identityNostrApi = await getIdentityNostrApi(toIdentity);


		const unwrappedDataKey = await unwrapDataKeyWithNip44({
			pubkey: toIdentity.pubkey,
			api: identityNostrApi,
			wrappedDataKeyCiphertext: toIdentity.wrappedDataKeyCiphertext,
		});


		if (!boot && currentIdentity !== null) { // When it's a dynamic switch, tear down stuff nicely
			log.info("tear-down-old-identity-started");

			dispatch(appApi.util.resetApiState());


			await persistor.flush().catch(() => { });


			dispatch(identitiesRegistryActions.clearActiveIdentityRuntime());
			dLogger.removeIdentityContext();

			const deferred = createDeferred<void>();
			dispatch(identityUnloaded({ deferred }));
			await deferred;

			await resetClientsCluster(); // Tear down nostr layer

			if (currentIdentity?.type === IdentityType.SANCTUM) {
				clearSanctumIdentitySdk(currentIdentity.pubkey);
			}
			removeScoped(dispatch);
		}


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
		localStorage.setItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY, toIdentity.pubkey);
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

export type CreateIdentityInput =
	| { type: IdentityType.LOCAL_KEY; privkey: string; label: string; relays: string[]; userPassword?: string }
	| { type: IdentityType.SANCTUM; tokensData: TokensData; label: string }
	| { type: IdentityType.NIP07; label: string; relays: string[] };

const buildIdentity = async (input: CreateIdentityInput): Promise<Identity> => {
	switch (input.type) {
		case IdentityType.LOCAL_KEY: {
			const pubkey = getPublicKey(hexToBytes(input.privkey));
			const localSecretStorage = await toLocalPrivateKeyStorage(pubkey, input.privkey, input.userPassword);
			const nostrApi = await getLocalKeysIdentityApi({ publicKey: pubkey, privateKey: input.privkey }, input.relays);
			const wrappedDataKeyCiphertext = await generateAndWrapDataKey(pubkey, nostrApi);
			const storageWrappedDataKey = await toWrappedDataKeyStorage(pubkey, wrappedDataKeyCiphertext);
			return {
				type: IdentityType.LOCAL_KEY,
				pubkey,
				label: input.label,
				relays: input.relays,
				wrappedDataKey: storageWrappedDataKey,
				localSecret: localSecretStorage,
				createdAt: Date.now(),
			}
		}
		case IdentityType.SANCTUM: {
			const sdk = createSanctumDK({
				url: SANCTUM_URL,
				tokenDataAdapter: {
					getTokenData: () => input.tokensData,
					setTokenData: () => { },
					clearTokenData: () => { },
				},
			});

			const pubkey = await sdk.api.getPublicKey();
			const wrappedDataKeyCiphertext = await generateAndWrapDataKey(
				pubkey,
				adaptSanctumDKApiToIdentityNostrApi(sdk.api),
			);
			const storageWrappedDataKey = await toWrappedDataKeyStorage(pubkey, wrappedDataKeyCiphertext);
			const storageTokensData = await toSanctumTokensStorage(pubkey, input.tokensData);
			return {
				type: IdentityType.SANCTUM,
				pubkey,
				label: input.label,
				wrappedDataKey: storageWrappedDataKey,
				sanctumTokens: storageTokensData,
				createdAt: Date.now(),
			}
		}
		case IdentityType.NIP07: {
			const nostrIdentityApi = await getNostrExtensionIdentityApi();
			const pubkey = await nostrIdentityApi.getPublicKey();
			const wrappedDataKeyCiphertext = await generateAndWrapDataKey(pubkey, nostrIdentityApi);
			const storageWrappedDataKey = await toWrappedDataKeyStorage(pubkey, wrappedDataKeyCiphertext);
			return {
				type: IdentityType.NIP07,
				pubkey,
				label: input.label,
				relays: input.relays,
				wrappedDataKey: storageWrappedDataKey,
				createdAt: Date.now(),
			}
		}

	}
}
export const createIdentity = (
	input: CreateIdentityInput,
	localSources?: SourceToMigrate[]
): AppThunk<Promise<{ foundBackup: boolean }>> => {
	return async (dispatch, getState) => {
		const identity = await buildIdentity(input);


		const log = dLogger.withContext({
			procedure: "create-identity",
			data: { pubkey: identity.pubkey, identityType: identity.type, sourcesToMigrate: localSources ? localSources.length : null }
		});
		if (getState().identitiesRegistry.entities[identity.pubkey]) {
			log.error("identity-already-exists");
			throw new Error("This identity already exists.");
		}
		const runtimeIdentity = await unlockIdentity(identity, { userPassword: input.type === IdentityType.LOCAL_KEY ? input.userPassword : undefined });
		const identityApi = await getIdentityNostrApi(runtimeIdentity, true);

		dispatch(identitiesRegistryActions._createNewIdentity({ identity }));
		dispatch(appStateActions.setAppBootstrapped());

		await dispatch(switchIdentity(runtimeIdentity));


		const identityDoc = await fetchNip78Event(identityApi, identityDocDtag);

		/*
		* This identity does not have an identity doc index.
		* However it may have legacy backup so we need to check that.
		*/

		if (identityDoc) {
			log.info("found-remote-identity-doc");
			return { foundBackup: true };
		}

		const migratedSourceDocs = await getRemoteMigratedSources(identityApi, localSources);
		if (migratedSourceDocs.length) {
			log.info("didn't find remote identity doc, but found legacy sources backups");
			for (const sourceDoc of migratedSourceDocs) {
				const { vanity_name, ...source } = sourceDoc


				dispatch(sourcesActions._createDraftDoc({ sourceId: source.source_id, draft: source }));

				if (vanity_name && source.type === SourceType.NPROFILE_SOURCE) {
					dispatch(sourcesActions.setVanityName({ sourceId: source.source_id, vanityName: vanity_name }));
				}
			}
			return { foundBackup: true };
		} else {
			return { foundBackup: false };
		}

	}
}

