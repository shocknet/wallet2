
import type { TokensData } from "sanctum-sdk";
import { AesGcmEnvelopeWithSalt } from "@/lib/aesGcm";

export enum IdentityType {
	LOCAL_KEY = "LOCAL_KEYS_IDENTITY",
	SANCTUM = "SANCTUM_IDENTITY",
	NIP07 = "NIP07_IDENTITY"
}


export function resolveIdentityRelays(identity: {
	type: IdentityType;
	relays?: string[];
}): string[] {
	if (identity.type === IdentityType.SANCTUM) {
		return ["wss://strfry.shock.network", "wss://relay.lightning.pub"];
	}
	return identity.relays ?? [];
}



export type WrappedDataKeyStorage =
	| { storage: "inline"; wrappedDataKeyCiphertext: string }
	| { storage: "secure_ref"; wrappedDataKeyRef: string };


export type LocalPrivateKeyPasswordMode = "default" | "user";

export type LocalPrivateKeyStorage =
	| { storage: "secure_ref"; localKeyRef: string }
	| { storage: "inline"; privateKey: string }
	| {
		storage: "inline_encrypted";
		encryptedPrivkey: AesGcmEnvelopeWithSalt;
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

export function isSecureIdentity(identity: unknown): identity is Identity {
	return (
		typeof identity === "object" &&
		identity !== null &&
		"wrappedDataKey" in identity &&
		(identity as { wrappedDataKey?: unknown }).wrappedDataKey !== undefined
	);
}
