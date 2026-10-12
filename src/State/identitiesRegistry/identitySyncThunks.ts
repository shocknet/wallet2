import type { AppThunk } from "@/State/store/store";
import { IdentityType } from "./types";
import { identitiesRegistryActions } from "./slice";

export const setIdentityRelays = (args: {
	pubkey: string;
	relays: string[];
}): AppThunk<void> => (dispatch) => {
	dispatch(identitiesRegistryActions.updateIdentityRelays(args));
};

export const setIdentityLabel = (args: {
	pubkey: string;
	label: string;
}): AppThunk<void> => (dispatch) => {
	dispatch(identitiesRegistryActions.updateRegistryIdentityLabel(args));
};

export const markSanctumReauthRequired = (args: {
	pubkey: string;
	reason?: string;
}): AppThunk<void> => (dispatch, getState) => {
	const identity = getState().identitiesRegistry.entities[args.pubkey];
	if (!identity || identity.type !== IdentityType.SANCTUM) return;

	dispatch(identitiesRegistryActions.markSanctumReauthRequired(args));
};

export const clearSanctumReauthRequired = (args: {
	pubkey: string;
}): AppThunk<void> => (dispatch, getState) => {
	const identity = getState().identitiesRegistry.entities[args.pubkey];
	if (!identity || identity.type !== IdentityType.SANCTUM) return;

	dispatch(identitiesRegistryActions.clearSanctumReauthRequired(args));
};
