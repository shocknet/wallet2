import { newLww } from "@/State/sync/lww"
import { IdentityType, type IdentityKeys } from "@/State/identitiesRegistry/types"
import type { RuntimeIdentityKeys } from "@/shell/types"
import { IdentityDocV0 } from "@/State/scoped/backups/identity/schema"
import { IdentityState } from "@/State/scoped/backups/identity/slice"

export const TEST_IDENTITY_PUBKEY = "hexhexhex";
export const TEST_IDENTITY_PRIVATE_KEY = "hexhexhex";
export const TEST_IDENTITY_RELAYS = ["wss://example.com"];
export const TEST_IDENTITY_LABEL = "label";
export const TEST_WRAPPED_DATA_KEY_CIPHERTEXT = "cipher";

export const TEST_CLOCK_BY = "test-device-id-00000";

export const TEST_IDENTITY: IdentityKeys = {
	type: IdentityType.LOCAL_KEY,
	label: TEST_IDENTITY_LABEL,
	createdAt: 1,
	pubkey: TEST_IDENTITY_PUBKEY,
	relays: TEST_IDENTITY_RELAYS,
	wrappedDataKey: { storage: "inline", wrappedDataKeyCiphertext: TEST_WRAPPED_DATA_KEY_CIPHERTEXT },
	localSecret: { storage: "inline", privateKey: TEST_IDENTITY_PRIVATE_KEY },
};

export const TEST_RUNTIME_IDENTITY: RuntimeIdentityKeys = {
	type: IdentityType.LOCAL_KEY,
	label: TEST_IDENTITY_LABEL,
	unlockedAtMs: 1,
	pubkey: TEST_IDENTITY_PUBKEY,
	privateKey: TEST_IDENTITY_PRIVATE_KEY,
	relays: TEST_IDENTITY_RELAYS,
	wrappedDataKeyCiphertext: TEST_WRAPPED_DATA_KEY_CIPHERTEXT,
};

export const createTestIdentityDoc = (
	pubkey: string = TEST_IDENTITY_PUBKEY,
	favouriteSourceId?: string,
): IdentityDocV0 => ({
	doc_type: "doc/shockwallet/identity_",
	favorite_source_id: newLww(favouriteSourceId ?? null, TEST_CLOCK_BY),
	identity_pubkey: pubkey,
	schema_rev: 0,
	created_at: Date.now(),
	fiatCurrency: newLww("USD", TEST_CLOCK_BY),
});

/** @deprecated use createTestIdentityDoc */
export const createTestIdentitydoc = createTestIdentityDoc;

export const getPreloadedIdentityState = (
	pubkey: string = TEST_IDENTITY_PUBKEY,
	favouriteSourceId?: string,
): IdentityState => ({
	dirty: true,
	draft: createTestIdentityDoc(pubkey, favouriteSourceId),
});
