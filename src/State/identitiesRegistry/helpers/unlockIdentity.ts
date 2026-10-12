import type { ScopedRuntimeIdentity } from "@/shell/types";
import { IdentityType, type Identity } from "../types";
import { resolveLocalPrivateKey } from "./platformSecretStorage";


/* returns runtime identity, which includes the secrets */
export async function unlockIdentity(
	identity: Identity,
	userPassword?: string
): Promise<ScopedRuntimeIdentity> {
	switch (identity.type) {
		case IdentityType.LOCAL_KEY: {
			const privateKey = await resolveLocalPrivateKey(identity, { userPassword });
			if (!privateKey) {
				throw new Error(`Unable to resolve local private key, password is incorrect`);
			}
			return {
				type: IdentityType.LOCAL_KEY,
				pubkey: identity.pubkey,
				privateKey,
				relays: identity.relays,
				unlockedAtMs: Date.now(),
			};
		}
		case IdentityType.SANCTUM:
			return {
				type: IdentityType.SANCTUM,
				pubkey: identity.pubkey,
				unlockedAtMs: Date.now(),
			};
		case IdentityType.NIP07:
			return {
				type: IdentityType.NIP07,
				pubkey: identity.pubkey,
				relays: identity.relays,
				unlockedAtMs: Date.now(),
			};
	}
}
