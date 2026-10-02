import type { AppThunk } from "@/State/store/store";
import { IdentityType } from "./types";
import { identitiesRegistryActions } from "./slice";

/**
 * redux writes that need to write to the identity registry
 * AND the active identity runtime
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

export const markSanctumReauthRequired = (args: {
	pubkey: string;
	reason?: string;
}): AppThunk<void> => (dispatch, getState) => {
	const identity = getState().identitiesRegistry.entities[args.pubkey];
	if (!identity || identity.type !== IdentityType.SANCTUM) return;

	dispatch(identitiesRegistryActions.markSanctumReauthRequired(args));
	dispatch(identitiesRegistryActions.setActiveSanctumReauthRequired(args));
};

export const clearSanctumReauthRequired = (args: {
	pubkey: string;
}): AppThunk<void> => (dispatch, getState) => {
	const identity = getState().identitiesRegistry.entities[args.pubkey];
	if (!identity || identity.type !== IdentityType.SANCTUM) return;

	dispatch(identitiesRegistryActions.clearSanctumReauthRequired(args));
	dispatch(identitiesRegistryActions.clearActiveSanctumReauthRequired(args));
};
