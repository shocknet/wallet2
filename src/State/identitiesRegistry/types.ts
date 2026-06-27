
import type { TokensData } from "sanctum-sdk";

export enum IdentityType {
	LOCAL_KEY = "LOCAL_KEYS_IDENTITY",
	SANCTUM = "SANCTUM_IDENTITY",
	NIP07 = "NIP07_IDENTITY"
}



export type WrappedDataKeyStorage =
	| { storage: "inline"; wrappedDataKeyCiphertext: string }
	| { storage: "secure_ref"; wrappedDataKeyRef: string };

export interface EncryptedBlobV1 {
	alg: "AES-GCM";
	nonce: string;
	ciphertext: string;
}

export type LocalPrivateKeyPasswordMode = "default" | "user";

export type LocalPrivateKeyStorage =
	| { storage: "secure_ref"; localKeyRef: string }
	| {
		storage: "inline_encrypted";
		scheme: "app-password-only-v1";
		passwordMode: LocalPrivateKeyPasswordMode;
		encryptedPrivkey: EncryptedBlobV1;
	};

export type SanctumTokensStorage =
	| { storage: "secure_ref"; sessionRef: string }
	| { storage: "inline"; tokensData: TokensData };

export interface IdentityBase {
	pubkey: string;
	label: string;
	createdAt: number;
	lastUsedAt?: number;
}

export interface IdentityKeys extends IdentityBase {
	type: IdentityType.LOCAL_KEY;
	relays: string[];
	wrappedDataKey: WrappedDataKeyStorage;
	localSecret: LocalPrivateKeyStorage;
}

export interface IdentityExtension extends IdentityBase {
	type: IdentityType.NIP07;
	relays: string[];
	wrappedDataKey: WrappedDataKeyStorage;
}

export interface IdentitySanctum extends IdentityBase {
	type: IdentityType.SANCTUM;
	wrappedDataKey: WrappedDataKeyStorage;
	sanctumTokens?: SanctumTokensStorage;
	reauthReason?: string;

}

export type Identity = IdentityKeys | IdentityExtension | IdentitySanctum;

export function isSecureIdentity(identity: Identity | IdentityV0): identity is Identity {
	return "wrappedDataKey" in identity && identity.wrappedDataKey !== undefined;
}



/* Runtime types for active identity */
type RuntimeIdentityBase<TIdentity extends Identity> =
	Pick<TIdentity, "type" | "pubkey" | "label"> & {
		unlockedAtMs: number;
		wrappedDataKeyCiphertext: string;
	};

export type RuntimeIdentityKeys =
	RuntimeIdentityBase<IdentityKeys> & {
		privateKey: string;
		relays: string[];
	};

export type RuntimeIdentitySanctum =
	RuntimeIdentityBase<IdentitySanctum> & {
		tokensData: TokensData | null;
		reauthReason: string | null;
	};

export type RuntimeIdentityExtension =
	RuntimeIdentityBase<IdentityExtension> & {
		relays: string[];
	};

export type RuntimeIdentity =
	| RuntimeIdentityKeys
	| RuntimeIdentitySanctum
	| RuntimeIdentityExtension;


/* V0 types for migration */
export interface IdentityBaseV0 {
	pubkey: string;
	label: string;
	createdAt: number;
	lastUsedAt?: number;
}

export interface IdentityKeysV0 extends IdentityBaseV0 {
	type: IdentityType.LOCAL_KEY;
	privkey: string;
	relays: string[];
}

export interface IdentityExtensionV0 extends IdentityBaseV0 {
	type: IdentityType.NIP07;
	relays: string[];
}

export interface IdentitySanctumV0 extends IdentityBaseV0 {
	type: IdentityType.SANCTUM;
	accessToken: string;
}

export type IdentityV0 = IdentityKeysV0 | IdentityExtensionV0 | IdentitySanctumV0;
