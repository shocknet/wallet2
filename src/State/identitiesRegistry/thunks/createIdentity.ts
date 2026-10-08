import dLogger from "@/Api/helpers/debugLog";
import type { AppThunk } from "@/State/store/store";
import {
	applyMigratedSourceDocs,
	getSourcesFromLegacyRemoteBackup,
	migrateLegacySourcesToDocs,
} from "../../../shell/migrations/deviceToIdentities/legacySources";
import { appStateActions } from "../../appState/slice";
import { getActiveIdentityNostrApi, getIdentityNostrApi } from "../helpers/identityNostrApi";
import { fetchNip78Event } from "../helpers/nostr";
import { identityDocDtag } from "../helpers/processDocs";
import { provisionIdentity, type CreateIdentityInput } from "../helpers/provisionIdentity";
import { identitiesRegistryActions } from "../slice";
import { switchIdentity } from "./switchIdentity";

export type { CreateIdentityInput };

export const createIdentity = (
	input: CreateIdentityInput,
): AppThunk<Promise<{ foundBackup: boolean; identityId: string }>> => {
	return async (dispatch, getState) => {
		const provisioned = await provisionIdentity(input);
		const { identity, runtime: runtimeIdentity } = provisioned;

		const log = dLogger.withContext({
			procedure: "create-identity",
			data: { pubkey: identity.pubkey, identityType: identity.type },
		});
		if (getState().identitiesRegistry.entities[identity.pubkey]) {
			log.error("identity-already-exists");
			throw new Error("This identity already exists.");
		}

		await getIdentityNostrApi(runtimeIdentity);

		dispatch(identitiesRegistryActions._createNewIdentity({ identity }));
		dispatch(appStateActions.setAppBootstrapped());

		await dispatch(switchIdentity(runtimeIdentity));

		const identityApi = await getActiveIdentityNostrApi();

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
