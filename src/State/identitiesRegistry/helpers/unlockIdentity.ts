import {
	RuntimeIdentity,
} from "@/State/identitiesRegistry/types";
import type { TokensData } from "sanctum-sdk";
import { IdentityType, type Identity, isSecureIdentity } from "../types";
import {
	resolveLocalPrivateKey,
	resolveSanctumTokensData,
	resolveWrappedDataKeyCiphertext,
} from "./platformSecretStorage";


export type UnlockIdentityOptions = {
	userPassword?: string;
	sanctumTokensData?: TokensData;
};



export async function unlockIdentity(
	identity: Identity,
	options: UnlockIdentityOptions = {}
): Promise<RuntimeIdentity> {
	if (!isSecureIdentity(identity)) {
		throw new Error("Identity has not completed secure migration");
	}

	const unlockedAtMs = Date.now();



	switch (identity.type) {
		case IdentityType.LOCAL_KEY: {
			const wrappedDataKeyCiphertext = await resolveWrappedDataKeyCiphertext(identity);
			const privateKey = await resolveLocalPrivateKey(identity, { userPassword: options.userPassword });
			if (!privateKey) {
				throw new Error(`Unable to resolve local private key for ${identity.pubkey}`);
			}
			return {
				type: IdentityType.LOCAL_KEY,
				pubkey: identity.pubkey,
				label: identity.label,
				relays: identity.relays,
				privateKey,
				unlockedAtMs,
				wrappedDataKeyCiphertext,
			};
		}
		case IdentityType.SANCTUM: {
			const wrappedDataKeyCiphertext = await resolveWrappedDataKeyCiphertext(identity);
			const tokensData = options.sanctumTokensData ?? await resolveSanctumTokensData(identity);
			return {
				type: IdentityType.SANCTUM,
				pubkey: identity.pubkey,
				label: identity.label,
				tokensData,
				reauthReason: identity.reauthReason ?? null,
				unlockedAtMs,
				wrappedDataKeyCiphertext,
			};
		}
		case IdentityType.NIP07: {
			const wrappedDataKeyCiphertext = await resolveWrappedDataKeyCiphertext(identity);
			return {
				type: IdentityType.NIP07,
				pubkey: identity.pubkey,
				relays: identity.relays,
				label: identity.label,
				unlockedAtMs,
				wrappedDataKeyCiphertext,
			};
		}
	}
}

