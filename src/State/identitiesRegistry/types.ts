
export enum IdentityType {
	LOCAL_KEY = "LOCAL_KEYS_IDENTITY",
	SANCTUM = "SANCTUM_IDENTITY",
	NIP07 = "NIP07_IDENTITY"
}

export interface IdentityBase {
	pubkey: string;
	label: string;
	createdAt: number;
	lastUsedAt?: number;
}

export interface IdentityKeys extends IdentityBase {
	type: IdentityType.LOCAL_KEY;
	privkey: string;
	relays: string[];
}

export interface IdentityExtension extends IdentityBase {
	type: IdentityType.NIP07;
	provider?: string;
	relays: string[];
}

export interface IdentitySanctum extends IdentityBase {
	type: IdentityType.SANCTUM;
	accessToken: string;
}

export type Identity = IdentityKeys | IdentityExtension | IdentitySanctum;
