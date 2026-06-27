import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { isAesGcmEnvelope } from "@/lib/aesGcm";
import { getScopedIdentityPersistKey } from "@/State/scoped/backups/identity/slice";
import { getScopedSourcesPersistKey } from "@/State/scoped/backups/sources/slice";
import { identitiesRegistryActions } from "../slice";
import {
	IdentityType,
	type IdentityExtensionV0,
	type IdentityKeysV0,
	type IdentitySanctumV0,
	type IdentityV0,
} from "../types";
import {
	migrateToSecureIdentities,
	SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY,
	type IdentitiesStateV0,
	type SecureIdentitiesMigrationJournal,
} from "./migrateToSecureIdentities";

const LOCAL_PRIVKEY = "0000000000000000000000000000000000000000000000000000000000000001";
const LOCAL_PUBKEY = getPublicKey(hexToBytes(LOCAL_PRIVKEY));
const SANCTUM_PUBKEY = "a".repeat(64);
const NIP07_PUBKEY = "b".repeat(64);

const LEGACY_ACCESS_TOKEN = "legacy-sanctum-access-token";
const SANCTUM_TOKENS = {
	accessToken: "new-access-token",
	refreshToken: "new-refresh-token",
};

const {
	storage,
	isNativePlatformMock,
	localApiMock,
	sanctumApiMock,
	nip07ApiMock,
	upgradeLegacySanctumIdentityMock,
	createSanctumDKMock,
} = vi.hoisted(() => {
	const storage = new Map<string, string>();
	const isNativePlatformMock = vi.fn(() => false);
	const localApiMock = {
		encrypt: vi.fn(async (_pubkey: string, plaintext: string) => `local:${plaintext}`),
	};
	const sanctumApiMock = {
		getPublicKey: vi.fn(async () => SANCTUM_PUBKEY),
		encrypt: vi.fn(async (_pubkey: string, plaintext: string) => `sanctum:${plaintext}`),
	};
	const nip07ApiMock = {
		getPublicKey: vi.fn(async () => NIP07_PUBKEY),
		encrypt: vi.fn(async (_pubkey: string, plaintext: string) => `nip07:${plaintext}`),
	};
	const upgradeLegacySanctumIdentityMock = vi.fn(async () => SANCTUM_TOKENS);
	const createSanctumDKMock = vi.fn(() => ({
		api: sanctumApiMock,
	}));

	return {
		storage,
		isNativePlatformMock,
		localApiMock,
		sanctumApiMock,
		nip07ApiMock,
		upgradeLegacySanctumIdentityMock,
		createSanctumDKMock,
	};
});

vi.mock("@capacitor/core", () => ({
	Capacitor: {
		isNativePlatform: isNativePlatformMock,
	},
}));

vi.mock("@/constants", () => ({
	SANCTUM_URL: "https://sanctum.example",
}));

vi.mock("@/storage/redux-persist-ionic-storage-adapter", () => ({
	default: {
		getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
		setItem: vi.fn(async (key: string, value: string) => {
			storage.set(key, value);
		}),
		removeItem: vi.fn(async (key: string) => {
			storage.delete(key);
		}),
	},
}));

vi.mock("./identityNostrApi", () => ({
	getLocalKeysIdentityApi: vi.fn(async () => localApiMock),
	getNostrExtensionIdentityApi: vi.fn(async () => nip07ApiMock),
}));

vi.mock("./secureSecrets", () => ({
	setLocalPrivateKey: vi.fn(async (identityId: string, privkey: string) => `local/${identityId}:${privkey}`),
	setSanctumTokensData: vi.fn(async (identityId: string) => `sanctum/${identityId}`),
}));

vi.mock("../identitiesMigration", () => ({
	upgradeLegacySanctumIdentity: upgradeLegacySanctumIdentityMock,
}));

vi.mock("sanctum-sdk", () => ({
	createSanctumDK: createSanctumDKMock,
}));

const canonicalLocalKeyV0 = (): IdentityKeysV0 => ({
	type: IdentityType.LOCAL_KEY,
	pubkey: LOCAL_PUBKEY,
	label: "My Nostr pair Identity",
	privkey: LOCAL_PRIVKEY,
	relays: ["wss://relay.example"],
	createdAt: 1_700_000_000_000,
	lastUsedAt: 1_700_000_100_000,
});

const canonicalSanctumV0 = (): IdentitySanctumV0 => ({
	type: IdentityType.SANCTUM,
	pubkey: SANCTUM_PUBKEY,
	label: "My Sanctum Identity",
	accessToken: LEGACY_ACCESS_TOKEN,
	createdAt: 1_700_000_000_000,
	lastUsedAt: 1_700_000_050_000,
});

const canonicalNip07V0 = (): IdentityExtensionV0 => ({
	type: IdentityType.NIP07,
	pubkey: NIP07_PUBKEY,
	label: "My Nostr Extension Identity",
	relays: ["wss://relay.example"],
	createdAt: 1_700_000_000_000,
});

const makeRegistryV0 = (identities: IdentityV0[]): IdentitiesStateV0 => ({
	ids: identities.map((identity) => identity.pubkey),
	entities: Object.fromEntries(identities.map((identity) => [identity.pubkey, identity])),
	activePubkey: null,
	topicIndexById: {},
});

const seedScopedPersist = (pubkey: string) => {
	storage.set(
		`persist:${getScopedIdentityPersistKey(pubkey)}`,
		JSON.stringify({ dirty: false, draft: undefined }),
	);
	storage.set(
		`persist:${getScopedSourcesPersistKey(pubkey)}`,
		JSON.stringify({
			metadata: JSON.stringify({
				ids: ["source-1"],
				entities: {
					"source-1": {
						id: "source-1",
						topicId: `topic-${pubkey.slice(0, 8)}`,
					},
				},
			}),
		}),
	);
};

const readJournal = (): SecureIdentitiesMigrationJournal => {
	const raw = storage.get(SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY);
	expect(raw).toBeTruthy();
	return JSON.parse(raw!) as SecureIdentitiesMigrationJournal;
};

describe("migrateToSecureIdentities", () => {
	let dispatched: unknown[];

	beforeEach(() => {
		storage.clear();
		dispatched = [];
		isNativePlatformMock.mockReturnValue(false);
		localApiMock.encrypt.mockClear();
		sanctumApiMock.encrypt.mockClear();
		sanctumApiMock.getPublicKey.mockResolvedValue(SANCTUM_PUBKEY);
		nip07ApiMock.encrypt.mockClear();
		nip07ApiMock.getPublicKey.mockResolvedValue(NIP07_PUBKEY);
		upgradeLegacySanctumIdentityMock.mockReset();
		upgradeLegacySanctumIdentityMock.mockResolvedValue(SANCTUM_TOKENS);
		createSanctumDKMock.mockClear();
	});

	const runMigration = async (identities: IdentityV0[]) => {
		for (const identity of identities) {
			seedScopedPersist(identity.pubkey);
		}

		await migrateToSecureIdentities({
			identitiesRegistry: makeRegistryV0(identities),
			dispatch: vi.fn((action) => {
				dispatched.push(action);
				return action;
			}) as never,
		});
	};

	it("migrates canonical V0 local, sanctum, and nip07 identities to secure shape", async () => {
		const identities = [
			canonicalLocalKeyV0(),
			canonicalSanctumV0(),
			canonicalNip07V0(),
		];

		await runMigration(identities);

		const upserts = dispatched.filter((action) =>
			identitiesRegistryActions._upsertIdentity.match(action as never)
		);
		expect(upserts).toHaveLength(3);

		const local = upserts.find((action) =>
			identitiesRegistryActions._upsertIdentity.match(action as never)
			&& (action as ReturnType<typeof identitiesRegistryActions._upsertIdentity>).payload.identity.pubkey === LOCAL_PUBKEY
		) as ReturnType<typeof identitiesRegistryActions._upsertIdentity> | undefined;
		expect(local?.payload.identity).toMatchObject({
			type: IdentityType.LOCAL_KEY,
			pubkey: LOCAL_PUBKEY,
			label: "My Nostr pair Identity",
			relays: ["wss://relay.example"],
			wrappedDataKey: {
				storage: "inline",
				wrappedDataKeyCiphertext: expect.stringMatching(/^local:/),
			},
			localSecret: {
				storage: "inline_encrypted",
				scheme: "app-password-only-v1",
				passwordMode: "default",
			},
		});

		const sanctum = upserts.find((action) =>
			identitiesRegistryActions._upsertIdentity.match(action as never)
			&& (action as ReturnType<typeof identitiesRegistryActions._upsertIdentity>).payload.identity.pubkey === SANCTUM_PUBKEY
		) as ReturnType<typeof identitiesRegistryActions._upsertIdentity> | undefined;
		expect(sanctum?.payload.identity).toMatchObject({
			type: IdentityType.SANCTUM,
			pubkey: SANCTUM_PUBKEY,
			label: "My Sanctum Identity",
			wrappedDataKey: {
				storage: "inline",
				wrappedDataKeyCiphertext: expect.stringMatching(/^sanctum:/),
			},
			sanctumTokens: {
				storage: "inline",
				tokensData: SANCTUM_TOKENS,
			},
		});
		expect(upgradeLegacySanctumIdentityMock).toHaveBeenCalledWith(LEGACY_ACCESS_TOKEN);

		const nip07 = upserts.find((action) =>
			identitiesRegistryActions._upsertIdentity.match(action as never)
			&& (action as ReturnType<typeof identitiesRegistryActions._upsertIdentity>).payload.identity.pubkey === NIP07_PUBKEY
		) as ReturnType<typeof identitiesRegistryActions._upsertIdentity> | undefined;
		expect(nip07?.payload.identity).toMatchObject({
			type: IdentityType.NIP07,
			pubkey: NIP07_PUBKEY,
			label: "My Nostr Extension Identity",
			relays: ["wss://relay.example"],
			wrappedDataKey: {
				storage: "inline",
				wrappedDataKeyCiphertext: expect.stringMatching(/^nip07:/),
			},
		});

		const topicUpdates = dispatched.filter((action) =>
			identitiesRegistryActions.setTopicIdIndex.match(action)
		);
		expect(topicUpdates).toHaveLength(3);
		expect(topicUpdates.map((action) => action.payload.identityId)).toEqual([LOCAL_PUBKEY, SANCTUM_PUBKEY, NIP07_PUBKEY]);
		expect(topicUpdates.map((action) => action.payload.topicId))
			.toMatchObject([
				`topic-${LOCAL_PUBKEY.slice(0, 8)}`,
				`topic-${SANCTUM_PUBKEY.slice(0, 8)}`,
				`topic-${NIP07_PUBKEY.slice(0, 8)}`
			]);

		const journal = readJournal();
		expect(journal.byPubkey[LOCAL_PUBKEY]?.status).toBe("success");
		expect(journal.byPubkey[SANCTUM_PUBKEY]?.status).toBe("success");
		expect(journal.byPubkey[NIP07_PUBKEY]?.status).toBe("success");
	});

	it("encrypts legacy scoped persist blobs during migration", async () => {
		await runMigration([canonicalLocalKeyV0()]);

		const identityPersist = storage.get(`persist:${getScopedIdentityPersistKey(LOCAL_PUBKEY)}`);
		const sourcesPersist = storage.get(`persist:${getScopedSourcesPersistKey(LOCAL_PUBKEY)}`);
		expect(isAesGcmEnvelope(JSON.parse(identityPersist!))).toBe(true);
		expect(isAesGcmEnvelope(JSON.parse(sourcesPersist!))).toBe(true);
	});

	it("skips identities already marked successful in the journal", async () => {
		storage.set(
			SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY,
			JSON.stringify({
				version: 1,
				byPubkey: {
					[LOCAL_PUBKEY]: {
						status: "success",
						attempts: 1,
						updatedAt: "2020-01-01T00:00:00.000Z",
					},
				},
			} satisfies SecureIdentitiesMigrationJournal),
		);

		await runMigration([canonicalLocalKeyV0(), canonicalNip07V0()]);

		const upserts = dispatched.filter((action) =>
			identitiesRegistryActions._upsertIdentity.match(action as never)
		);
		expect(upserts).toHaveLength(1);
		expect(
			(upserts[0] as ReturnType<typeof identitiesRegistryActions._upsertIdentity>).payload.identity.pubkey
		).toBe(NIP07_PUBKEY);
	});

	it("records failed_retryable and keeps the identity on retryable failures", async () => {
		upgradeLegacySanctumIdentityMock.mockRejectedValueOnce(new Error("sanctum offline"));

		await runMigration([canonicalSanctumV0()]);

		expect(dispatched.some((action) =>
			identitiesRegistryActions._upsertIdentity.match(action as never)
		)).toBe(false);
		expect(dispatched.some((action) =>
			identitiesRegistryActions.removeIdentity.match(action as never)
		)).toBe(false);

		const journal = readJournal();
		expect(journal.byPubkey[SANCTUM_PUBKEY]).toMatchObject({
			status: "failed_retryable",
			attempts: 1,
			lastError: "sanctum offline",
		});
	});

	it("retries failed_retryable identities on a later run", async () => {
		storage.set(
			SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY,
			JSON.stringify({
				version: 1,
				byPubkey: {
					[SANCTUM_PUBKEY]: {
						status: "failed_retryable",
						attempts: 1,
						updatedAt: "2020-01-01T00:00:00.000Z",
						lastError: "sanctum offline",
					},
				},
			} satisfies SecureIdentitiesMigrationJournal),
		);

		await runMigration([canonicalSanctumV0()]);

		expect(dispatched.some((action) =>
			identitiesRegistryActions._upsertIdentity.match(action as never)
		)).toBe(true);
		expect(readJournal().byPubkey[SANCTUM_PUBKEY]).toMatchObject({
			status: "success",
			attempts: 2,
		});
	});

	it("drops terminal local-key mismatches without a journal entry", async () => {
		const brokenLocal = {
			...canonicalLocalKeyV0(),
			pubkey: "dead".repeat(16),
		};

		await runMigration([brokenLocal]);

		expect(dispatched.some((action) =>
			identitiesRegistryActions.removeIdentity.match(action as never)
		)).toBe(true);
		expect(readJournal().byPubkey[brokenLocal.pubkey]).toBeUndefined();
		expect(storage.has(`persist:${getScopedIdentityPersistKey(brokenLocal.pubkey)}`)).toBe(false);
		expect(storage.has(`persist:${getScopedSourcesPersistKey(brokenLocal.pubkey)}`)).toBe(false);
	});

	it("drops terminal sanctum pubkey mismatches without a journal entry", async () => {
		sanctumApiMock.getPublicKey.mockResolvedValueOnce("mismatch-pubkey");

		await runMigration([canonicalSanctumV0()]);

		expect(dispatched.some((action) =>
			identitiesRegistryActions.removeIdentity.match(action as never)
		)).toBe(true);
		expect(readJournal().byPubkey[SANCTUM_PUBKEY]).toBeUndefined();
	});

	it("drops terminal nip07 pubkey mismatches without a journal entry", async () => {
		nip07ApiMock.getPublicKey.mockResolvedValueOnce("mismatch-pubkey");

		await runMigration([canonicalNip07V0()]);

		expect(dispatched.some((action) =>
			identitiesRegistryActions.removeIdentity.match(action as never)
		)).toBe(true);
		expect(readJournal().byPubkey[NIP07_PUBKEY]).toBeUndefined();
	});
});
