import type { TokensData } from "sanctum-sdk";
import { IdentityType, type Identity } from "../types";
import {
	resolveLocalPrivateKey,
	resolveSanctumTokensData,
	resolveWrappedDataKeyCiphertext,
} from "./platformSecretStorage";
import { RuntimeIdentity } from "@/shell/types";


export type UnlockIdentityOptions = {
	userPassword?: string;
	sanctumTokensData?: TokensData;
};


/* returns runtime identity, which includes the secrets */
export async function unlockIdentity(
	identity: Identity,
	userPassword?: string
): Promise<RuntimeIdentity> {


	const unlockedAtMs = Date.now();

	switch (identity.type) {
		case IdentityType.LOCAL_KEY: {
			const wrappedDataKeyCiphertext = await resolveWrappedDataKeyCiphertext(identity);
			const privateKey = await resolveLocalPrivateKey(identity, { userPassword });
			if (!privateKey) {
				throw new Error(`Unable to resolve local private key, password is incorrect`);
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
			const tokensData = await resolveSanctumTokensData(identity);
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

