import type { TokensData } from "sanctum-sdk";
import type { AppThunk } from "@/State/store/store";
import { IdentityType } from "./types";
import { identitiesRegistryActions } from "./slice";
import {
	toSanctumTokensStorage,
} from "./helpers/platformSecretStorage";
import { deleteSanctumSession } from "./helpers/secureSecrets";

/**
 * redux writes that need to write to the identity registry in storage A
 * AND the active identity runtime in memory
 */

export const setIdentityRelays = (args: {
	pubkey: string;
	relays: string[];
}): AppThunk<void> => (dispatch) => {
	dispatch(identitiesRegistryActions.updateIdentityRelays(args));
	dispatch(identitiesRegistryActions.updateActiveIdentityRelays(args));
};

export const setIdentityLabel = (args: {
	pubkey: string;
	label: string;
}): AppThunk<void> => (dispatch) => {
	dispatch(identitiesRegistryActions.updateRegistryIdentityLabel(args));
	dispatch(identitiesRegistryActions.updateActiveIdentityLabel(args));
};


export const setIdentitySanctumTokensData = (args: {
	pubkey: string;
	tokensData: TokensData;
}): AppThunk<Promise<void>> => async (dispatch) => {
	const sanctumTokens = await toSanctumTokensStorage(args.pubkey, args.tokensData);

	dispatch(
		identitiesRegistryActions.setSanctumTokensStorage({
			pubkey: args.pubkey,
			sanctumTokens,
		}),
	);
	dispatch(
		identitiesRegistryActions.setActiveSanctumTokensData({
			pubkey: args.pubkey,
			tokensData: args.tokensData,
		}),
	);
};

export const clearIdentitySanctumTokensData = (args: {
	pubkey: string;
}): AppThunk<Promise<void>> => async (dispatch, getState) => {
	const identity = getState().identitiesRegistry.entities[args.pubkey];
	if (!identity || identity.type !== IdentityType.SANCTUM) {
		throw new Error(`Sanctum identity ${args.pubkey} does not exist`);
	}

	if (identity.sanctumTokens?.storage === "secure_ref") {
		await deleteSanctumSession(identity.sanctumTokens.sessionRef);
	}

	dispatch(identitiesRegistryActions.clearSanctumTokensData({ pubkey: args.pubkey }));
	dispatch(identitiesRegistryActions.clearActiveSanctumTokensData({ pubkey: args.pubkey }));
};

export const markSanctumReauthRequired = (args: {
	pubkey: string;
	reason?: string;
}): AppThunk<void> => (dispatch, getState) => {
	const identity = getState().identitiesRegistry.entities[args.pubkey];
	if (!identity || identity.type !== IdentityType.SANCTUM) return;

	dispatch(identitiesRegistryActions.markSanctumReauthRequired(args));
	dispatch(identitiesRegistryActions.setActiveSanctumReauthRequired(args));
};
