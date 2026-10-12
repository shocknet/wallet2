import { resetClientsCluster } from "@/Api/nostr";
import dLogger from "@/Api/helpers/debugLog";
import { getDeviceId } from "@/constants";
import { createDeferred } from "@/lib/deferred";
import { identityActions, selectIdentityDraft } from "@/State/scoped/backups/identity/slice";
import type { AppThunk } from "@/State/store/store";
import type { ScopedRuntimeIdentity } from "@/shell/types";
import { appApi } from "../../api/api";
import { identityUnloaded } from "../../listeners/actions";
import { unwrapDataKeyWithNip44 } from "../helpers/datakey";
import { deleteLegacyBeaconsPersist } from "../helpers/deleteIdentityStorage";
import { getIdentityNostrApi } from "../helpers/identityNostrApi";
import { clearSanctumIdentitySdk } from "../helpers/sanctumIdentitySdkManager";
import { identitiesRegistryActions, selectActiveIdentity } from "../slice";
import { resolveWrappedDataKeyCiphertext } from "../helpers/platformSecretStorage";
import { IdentityType } from "../types";

export const tearDownCurrentIdentity = (): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const state = getState();
		const currentIdentity = selectActiveIdentity(state);

		if (!currentIdentity || !state.scoped) {
			return;
		}

		const log = dLogger.withContext({
			procedure: "unload-active-identity",
			data: { pubkey: currentIdentity.pubkey },
		});
		log.info("started");

		dispatch(appApi.util.resetApiState());
		dLogger.removeIdentityContext();

		const deferred = createDeferred<void>();
		dispatch(identityUnloaded({ deferred }));
		await deferred;

		await resetClientsCluster();

		if (currentIdentity.type === IdentityType.SANCTUM) {
			clearSanctumIdentitySdk(currentIdentity.pubkey);
		}

		log.info("completed");
	};
};

export const switchIdentity = (toIdentity: ScopedRuntimeIdentity): AppThunk<Promise<void>> => {
	return async (dispatch, getState, { mountScope }) => {

		const log = dLogger.withContext({
			procedure: "switch-identity",
			data: { pubkey: toIdentity.pubkey }
		});

		log.info("started");

		const state = getState();
		const currentIdentity = selectActiveIdentity(state);


		if (currentIdentity?.pubkey === toIdentity.pubkey) {
			log.debug("aborted-same-pubkey");
			return;
		}

		const fromRegistry = state.identitiesRegistry.entities[toIdentity.pubkey]
		if (!fromRegistry || fromRegistry.type !== toIdentity.type) {
			log.error("switch-to-nonexisting-identity");
			throw new Error("Identity does not exist");
		}

		const deviceId = getDeviceId();

		// Will throw if identity isn"t healthy (nostr extension issues, sanctum session issues)
		const identityNostrApi = await getIdentityNostrApi(toIdentity);

		const unwrappedDataKey = await unwrapDataKeyWithNip44({
			pubkey: toIdentity.pubkey,
			api: identityNostrApi,
			wrappedDataKeyCiphertext: await resolveWrappedDataKeyCiphertext(fromRegistry),
		});

		await dispatch(tearDownCurrentIdentity());

		await mountScope({
			scopeId: toIdentity.pubkey,
			dataKey: unwrappedDataKey,
			runtimeIdentity: toIdentity,
		});
		void deleteLegacyBeaconsPersist(toIdentity.pubkey).catch(() => { });

		const draft = selectIdentityDraft(getState());

		// If no identity doc yet, init it. If a remote version comes they will converge naturally
		if (draft === undefined) {
			log.debug("init-identity-doc");
			dispatch(identityActions.initIdentityDoc({ identity_pubkey: toIdentity.pubkey, by: deviceId }));
		}

		dispatch(identitiesRegistryActions.setLastActiveIdentityId({ pubkey: toIdentity.pubkey }));
		dLogger.setIdentityContext({ identityPubkey: toIdentity.pubkey, identityType: toIdentity.type });

	}
}
