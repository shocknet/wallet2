import dLogger from "@/Api/helpers/debugLog";
import { persistor, type AppThunk } from "@/State/store/store";
import { deleteIdentityPersistedData } from "../helpers/deleteIdentityStorage";
import { identitiesRegistryActions } from "../slice";

export const LAST_ACTIVE_IDENTITY_PUBKEY_KEY = "__shockwallet_lai_";

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
