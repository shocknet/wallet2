import { IdentityType } from "@/State/identitiesRegistry/types";

/* Pre-secure identity shapes. Only used by the secure-identities migration. */

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
