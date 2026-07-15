import { Capacitor } from "@capacitor/core";
import type { TokensData } from "sanctum-sdk";
import type {
	Identity,
	IdentityKeys,
	IdentitySanctum,
	LocalPrivateKeyStorage,
	SanctumTokensStorage,
	WrappedDataKeyStorage,
} from "../types";
import {
	decryptStringAesGcm,
	deriveAesGcmKeyFromPassword,
	passwordDeriveAndEcrypt,
} from "@/lib/aesGcm";
import { base64urlDecode, } from "@/lib/base64url";
import {
	getLocalPrivateKey,
	getSanctumTokensData,
	getWrappedDataKeyCiphertext,
	setLocalPrivateKey,
	setSanctumTokensData,
	setWrappedDataKeyCiphertext,
} from "./secureSecrets";

export const LOCAL_PRIVKEY_AAD = { purpose: "local-privkey" } as const;

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
		const envelope = await passwordDeriveAndEcrypt({
			plaintext: privkey,
			aad: LOCAL_PRIVKEY_AAD,
			password: userPassword,
		});

		return {
			storage: "inline_encrypted",
			encryptedPrivkey: envelope,
		};
	} else {
		return {
			storage: "inline",
			privateKey: privkey,
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
): Promise<string> {
	if (identity.localSecret.storage === "secure_ref") {
		const localPrivKey = await getLocalPrivateKey(identity.localSecret.localKeyRef);
		if (!localPrivKey) {
			throw new Error(`Local private key missing from secure storage for identity ${identity.pubkey}`);
		}
		return localPrivKey;
	}
	if (identity.localSecret.storage === "inline_encrypted") {
		if (!args?.userPassword) {
			throw new Error(`User password not provided for inline encrypted local private key for identity ${identity.pubkey}`);
		}
		const { salt, ...envelope } = identity.localSecret.encryptedPrivkey;
		const key = await deriveAesGcmKeyFromPassword(
			args.userPassword,
			base64urlDecode(salt),
		);
		try {
			return await decryptStringAesGcm({
				key,
				envelope,
				expectedAad: LOCAL_PRIVKEY_AAD,
			});
		} catch {
			throw new Error("Failed to decrypt local private key. Incorrect password");
		}

	}

	return identity.localSecret.privateKey;
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
