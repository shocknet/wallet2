import { Capacitor } from "@capacitor/core";
import type { TokensData } from "sanctum-sdk";
import type { AppThunk } from "../../store/store";
import { identitiesRegistryActions } from "../slice";
import type {
	Identity,
	IdentityKeys,
	IdentitySanctum,
	LocalPrivateKeyStorage,
	SanctumTokensStorage,
	WrappedDataKeyStorage,
} from "../types";
import { IdentityType } from "../types";
import { decryptLocalPrivateKeyForWeb, encryptLocalPrivateKeyForWeb } from "./localSecretCrypto";
import {
	deleteSanctumSession,
	getLocalPrivateKey,
	getSanctumTokensData,
	getWrappedDataKeyCiphertext,
	setLocalPrivateKey,
	setSanctumTokensData,
	setWrappedDataKeyCiphertext,
} from "./secureSecrets";

export async function resolveWrappedDataKeyCiphertext(
	identity: Identity
): Promise<string> {
	if (identity.wrappedDataKey.storage === "inline") {
		return identity.wrappedDataKey.wrappedDataKeyCiphertext;
	}
	const fromSecureStorage = await getWrappedDataKeyCiphertext(identity.wrappedDataKey.wrappedDataKeyRef);
	if (!fromSecureStorage) {
		throw new Error("Wrapped data key reference is unavailable");
	}
	return fromSecureStorage;
}

export async function toWrappedDataKeyStorage(
	identityId: string,
	wrappedDataKeyCiphertext: string
): Promise<WrappedDataKeyStorage> {
	if (Capacitor.isNativePlatform()) {
		const wrappedDataKeyRef = await setWrappedDataKeyCiphertext(identityId, wrappedDataKeyCiphertext);
		return {
			storage: "secure_ref",
			wrappedDataKeyRef,
		};
	}
	return {
		storage: "inline",
		wrappedDataKeyCiphertext,
	};
}

export async function toLocalPrivateKeyStorage(
	identityId: string,
	privkey: string,
	userPassword?: string
): Promise<LocalPrivateKeyStorage> {
	if (Capacitor.isNativePlatform()) {
		const localKeyRef = await setLocalPrivateKey(identityId, privkey);
		return {
			storage: "secure_ref",
			localKeyRef,
		};
	}

	if (userPassword) {
		const encryptedPrivkey = await encryptLocalPrivateKeyForWeb(privkey, userPassword);
		return {
			storage: "inline_encrypted",
			scheme: "app-password-only-v1",
			passwordMode: "user",
			encryptedPrivkey,
		};
	} else {
		const encryptedPrivkey = await encryptLocalPrivateKeyForWeb(privkey);
		return {
			storage: "inline_encrypted",
			scheme: "app-password-only-v1",
			passwordMode: "default",
			encryptedPrivkey,
		};
	}
}

export async function toSanctumTokensStorage(
	identityId: string,
	tokensData: TokensData
): Promise<SanctumTokensStorage> {
	if (Capacitor.isNativePlatform()) {
		const sessionRef = await setSanctumTokensData(identityId, tokensData);
		return {
			storage: "secure_ref",
			sessionRef,
		};
	}
	return {
		storage: "inline",
		tokensData,
	};
}

export async function resolveLocalPrivateKey(
	identity: IdentityKeys,
	args?: {
		userPassword?: string;
	}
): Promise<string | null> {
	if (identity.localSecret.storage === "secure_ref") {
		const localPrivKey = await getLocalPrivateKey(identity.localSecret.localKeyRef);
		if (!localPrivKey) {
			throw new Error(`Missing local private key for identity ${identity.pubkey}`);
		}
		return localPrivKey;
	}
	const passwordMode = identity.localSecret.passwordMode;
	if (passwordMode === "user" && !args?.userPassword) {
		throw new Error(`Missing user password for local identity ${identity.pubkey}`);
	}
	return decryptLocalPrivateKeyForWeb(
		identity.localSecret.encryptedPrivkey,
		passwordMode === "user" ? args?.userPassword : undefined
	);
}

export async function resolveSanctumTokensData(
	identity: IdentitySanctum
): Promise<TokensData | null> {
	if (!identity.sanctumTokens) return null;
	if (identity.sanctumTokens.storage === "inline") {
		return identity.sanctumTokens.tokensData;
	}
	return getSanctumTokensData(identity.sanctumTokens.sessionRef);
}

export const setIdentityWrappedDataKey = (args: {
	pubkey: string;
	wrappedDataKeyCiphertext: string;
}): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const identity = getState().identitiesRegistry.entities[args.pubkey];
		if (!identity) throw new Error(`Identity ${args.pubkey} does not exist`);

		const wrappedDataKey = await toWrappedDataKeyStorage(args.pubkey, args.wrappedDataKeyCiphertext);
		dispatch(
			identitiesRegistryActions.setIdentityWrappedDataKeyStorage({
				pubkey: args.pubkey,
				wrappedDataKey,
			})
		);
	};
};

export const setIdentityLocalPrivateKey = (args: {
	pubkey: string;
	privkey: string;
}): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const identity = getState().identitiesRegistry.entities[args.pubkey];
		if (!identity || identity.type !== IdentityType.LOCAL_KEY) {
			throw new Error(`Local-key identity ${args.pubkey} does not exist`);
		}

		const localSecret = await toLocalPrivateKeyStorage(args.pubkey, args.privkey);
		dispatch(
			identitiesRegistryActions.setLocalSecretStorage({
				pubkey: args.pubkey,
				localSecret,
			})
		);
	};
};

export const setIdentitySanctumTokensData = (args: {
	pubkey: string;
	tokensData: TokensData;
}): AppThunk<Promise<void>> => {
	return async (dispatch) => {

		const sanctumTokens = await toSanctumTokensStorage(args.pubkey, args.tokensData);
		dispatch(
			identitiesRegistryActions.setSanctumTokensStorage({
				pubkey: args.pubkey,
				sanctumTokens,
			})
		);
	};
};

export const clearIdentitySanctumTokensData = (args: {
	pubkey: string;
}): AppThunk<Promise<void>> => {
	return async (dispatch, getState) => {
		const identity = getState().identitiesRegistry.entities[args.pubkey];
		if (!identity || identity.type !== IdentityType.SANCTUM) {
			throw new Error(`Sanctum identity ${args.pubkey} does not exist`);
		}

		if (identity.sanctumTokens?.storage === "secure_ref") {
			await deleteSanctumSession(identity.sanctumTokens.sessionRef);
		}

		dispatch(identitiesRegistryActions.clearSanctumTokensData({ pubkey: args.pubkey }));
	};
};
