
import { resetClientsCluster } from "@/Api/nostr";
import getIdentityNostrApi from "./helpers/identityNostrApi";
import { checkDirtyRequested, identityLoaded, identityUnloaded, publisherFlushRequested, upgradeSourcesToNofferBridge } from "./middleware/actions";
import { identitiesRegistryActions, selectActiveIdentityId } from "./slice";
import { persistor, type AppThunk } from "@/State/store/store";
import { getAllScopedPersistKeys, injectNewScopedReducer, removeScoped } from "../scoped/scopedReducer";
import { waitForRehydrateKeys } from "./middleware/switcher";
import { identityActions, selectIdentityDraft } from "../scoped/backups/identity/slice";
import { getDeviceId, NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from "@/constants";
import { Identity } from "./types";
import { getIdentityDocDtag } from "./helpers/processDocs";
import { fetchNip78Event } from "./helpers/nostr";
import { sourcesActions } from "../scoped/backups/sources/slice";
import { getRemoteMigratedSources, SourceToMigrate } from "./helpers/migrateToIdentities";
import { appApi } from "../api/api";
import { onAddSourceDoc } from "../scoped/backups/sources/thunks";
import { SourceDocV0 } from "../scoped/backups/sources/schema";
import { SourceType } from "../scoped/common";
import { generateNewKeyPair } from "@/Api/helpers";
import { LwwFlag, newLww } from "../scoped/backups/lww";
import { utils } from "nostr-tools";




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

		if (!boot) { // When it's a dynamic switch, tear down stuff nicely

			dispatch(appApi.util.resetApiState());

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

		dispatch(appApi.endpoints.streamBeacons.initiate());


		setTimeout(() => {
			dispatch(checkDirtyRequested());
			dispatch(upgradeSourcesToNofferBridge());
		}, 200);
	}
}


export const createIdentity = (identity: Identity, localSources?: SourceToMigrate[]): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const deviceId = getDeviceId();

		if (getState().identitiesRegistry.entities[identity.pubkey]) {
			throw new Error("This identity already exists.");
		}
		// Will throw if identity isn"t healthy (nostr extension issues, sanctum access issues)
		const identityApi = await getIdentityNostrApi(identity);

		dispatch(identitiesRegistryActions._createNewIdentity({ identity }));

		await dispatch(switchIdentity(identity.pubkey));


		const identityDoc = await fetchNip78Event(identityApi, getIdentityDocDtag(identity.pubkey));

		/*
		* This identity does not have an identity doc index.
		* However it may have legacy backup so we need to check that.
		*/
		if (!identityDoc) {
			const migratedSourceDocs = await getRemoteMigratedSources(identityApi, localSources);
			if (migratedSourceDocs.length) {
				for (const source of migratedSourceDocs) {

					dispatch(sourcesActions._createDraftDoc({ sourceId: source.source_id, draft: source }));
					await dispatch(onAddSourceDoc(source));
					await new Promise<void>(res => setTimeout(() => res(), 50)); // throttle source additions so publisher can pick them up
				}

			} else {
				const keyPair = generateNewKeyPair()
				const id = `${NOSTR_PUB_DESTINATION}-${keyPair.publicKey}`;
				const relaysFlags: Record<string, LwwFlag> = {};
				NOSTR_RELAYS.forEach(r => {
					relaysFlags[utils.normalizeURL(r)] = { clock: { v: 0, by: deviceId }, present: true }
				})
				const bootstrapSource: SourceDocV0 = {
					type: SourceType.NPROFILE_SOURCE,
					doc_type: "doc/shockwallet/source_",
					source_id: id,
					schema_rev: 0,
					created_at: Date.now(),
					lpk: NOSTR_PUB_DESTINATION,
					label: newLww("Bootstrap Node", deviceId),
					relays: relaysFlags,
					deleted: newLww(false, deviceId),
					keys: keyPair,
					admin_token: newLww(null, deviceId),
					is_ndebit_discoverable: newLww(false, deviceId),
					bridgeUrl: newLww(null, deviceId)
				}
				dispatch(sourcesActions._createDraftDoc({ sourceId: bootstrapSource.source_id, draft: bootstrapSource }));
				await dispatch(onAddSourceDoc(bootstrapSource));
			}
		}
	}
}

