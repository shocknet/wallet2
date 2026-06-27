import { EntityState } from "@reduxjs/toolkit";
import { IdentityExtension, IdentityKeys, IdentitySanctum, IdentityType, IdentityV0, isSecureIdentity, SanctumTokensStorage } from "../types";
import { identitiesRegistryActions } from "../slice";
import { encryptStringAesGcm, exportAesGcmKey, generateAesGcmKey, isAesGcmEnvelope } from "@/lib/aesGcm";
import { getLocalKeysIdentityApi, getNostrExtensionIdentityApi } from "./identityNostrApi";
import { base64urlEncode } from "@/lib/base64url";
import { toWrappedDataKeyStorage } from "./platformSecretStorage";
import { setLocalPrivateKey, setSanctumTokensData } from "./secureSecrets";
import { deleteIdentityScopedPersist } from "./deleteIdentityStorage";
import { encryptLocalPrivateKeyForWeb } from "./localSecretCrypto";
import { Capacitor } from "@capacitor/core";
import { upgradeLegacySanctumIdentity } from "../identitiesMigration";
import { createSanctumDK } from "sanctum-sdk";
import { SANCTUM_URL } from "@/constants";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { getScopedSourcesPersistKey } from "@/State/scoped/backups/sources/slice";
import { SourcesState } from "@/State/scoped/backups/sources/state";
import { getScopedIdentityPersistKey } from "@/State/scoped/backups/identity/slice";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import type { AppDispatch } from "@/State/store/store";

export interface IdentitiesStateV0 extends EntityState<IdentityV0, string> {
	activePubkey: string | null;
	topicIndexById: Record<string, { identityId: string; sourceId: string }>;
}

export const SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY = "__secure_identities_migration_journal_v1__";

type JournalStatus = "success" | "failed_retryable";

type JournalEntry = {
	status: JournalStatus;
	attempts: number;
	updatedAt: string;
	lastError?: string;
};

export type SecureIdentitiesMigrationJournal = {
	version: 1;
	byPubkey: Record<string, JournalEntry>;
};

type MigrationResult = {
	pubkey: string;
	identity: IdentityKeys | IdentitySanctum | IdentityExtension | null;
	topics: { topicId: string; sourceId: string }[];
	error?: string;
	failureKind?: "retryable" | "terminal";
};

function shouldAttemptMigration(
	identity: IdentityV0,
	journal: SecureIdentitiesMigrationJournal,
): boolean {
	if (isSecureIdentity(identity)) {
		return false;
	}

	const entry = journal.byPubkey[identity.pubkey];
	if (entry?.status === "success") {
		return false;
	}

	return true;
}

function removeJournalEntry(
	journal: SecureIdentitiesMigrationJournal,
	pubkey: string,
) {
	delete journal.byPubkey[pubkey];
}

async function deleteTerminalIdentity(args: {
	pubkey: string;
	dispatch: AppDispatch;
	journal: SecureIdentitiesMigrationJournal;
	error?: string;
}) {
	args.dispatch(identitiesRegistryActions.removeIdentity({ pubkey: args.pubkey }));
	await deleteIdentityScopedPersist(args.pubkey);
	removeJournalEntry(args.journal, args.pubkey);
	console.error("Dropped identity after terminal secure migration failure", {
		pubkey: args.pubkey,
		error: args.error,
	});
}

async function readMigrationJournal(): Promise<SecureIdentitiesMigrationJournal> {
	const raw = await IonicStorageAdapter.getItem(SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY);
	if (!raw) {
		return { version: 1, byPubkey: {} };
	}
	try {
		const parsed = JSON.parse(raw) as Partial<SecureIdentitiesMigrationJournal>;
		const byPubkey = parsed.byPubkey ?? {};
		return {
			version: 1,
			byPubkey,
		};
	} catch {
		return { version: 1, byPubkey: {} };
	}
}

async function writeMigrationJournal(journal: SecureIdentitiesMigrationJournal): Promise<void> {
	await IonicStorageAdapter.setItem(SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY, JSON.stringify(journal));
}

function updateJournalEntry(
	journal: SecureIdentitiesMigrationJournal,
	pubkey: string,
	status: JournalStatus,
	error?: string
) {
	const previous = journal.byPubkey[pubkey];
	journal.byPubkey[pubkey] = {
		status,
		attempts: (previous?.attempts ?? 0) + 1,
		updatedAt: new Date().toISOString(),
		lastError: error,
	};
}

export async function migrateToSecureIdentities(args: {
	identitiesRegistry: IdentitiesStateV0;
	dispatch: AppDispatch;
}): Promise<void> {
	const journal = await readMigrationJournal();
	const inputIdentities = Object.values(args.identitiesRegistry.entities).filter(
		(identity): identity is IdentityV0 =>
			Boolean(identity) && shouldAttemptMigration(identity, journal)
	);
	const results = await Promise.all(inputIdentities.map((identity) => migrateSingleIdentity(identity)));
	for (const result of results) {
		const { pubkey, identity, topics, error, failureKind } = result;
		if (!identity) {
			if (failureKind === "terminal") {
				await deleteTerminalIdentity({
					pubkey,
					dispatch: args.dispatch,
					journal,
					error,
				});
				continue;
			}

			updateJournalEntry(
				journal,
				pubkey,
				"failed_retryable",
				error ?? "migration failed"
			);
			continue;
		}
		args.dispatch(identitiesRegistryActions._upsertIdentity({ identity }));

		for (const topic of topics) {
			args.dispatch(identitiesRegistryActions.setTopicIdIndex({
				identityId: identity.pubkey,
				topicId: topic.topicId,
				sourceId: topic.sourceId,
			}));
		}

		updateJournalEntry(journal, pubkey, "success");
	}
	await writeMigrationJournal(journal);
}

async function migrateSingleIdentity(identity: IdentityV0): Promise<MigrationResult> {
	try {
		const pubkey = identity.pubkey;
		switch (identity.type) {
			case IdentityType.LOCAL_KEY: {
				const { dataKey, encodedKey } = await generateAndEncodeDataKey();

				const privKey = identity.privkey;
				const pubkey = getPublicKey(hexToBytes(privKey));
				if (pubkey !== identity.pubkey) {
					return {
						pubkey: identity.pubkey,
						identity: null,
						topics: [],
						error: "local key does not match identity pubkey",
						failureKind: "terminal",
					};
				}
				const localApi = await getLocalKeysIdentityApi(
					{ publicKey: identity.pubkey, privateKey: privKey },
					identity.relays
				);
				const wrappedDataKeyCiphertext = await localApi.encrypt(identity.pubkey, encodedKey);
				const stateWrappedDataKey = await toWrappedDataKeyStorage(identity.pubkey, wrappedDataKeyCiphertext);

				const topicIds = await getTopicIdsForIdentity(identity);


				await encryptIdentityScopedSlice({
					identityId: identity.pubkey,
					sliceName: "identity",
					dataKey,
				});
				await encryptIdentityScopedSlice({
					identityId: identity.pubkey,
					sliceName: "sources",
					dataKey,
				});



				const newIdentity: IdentityKeys = {
					type: IdentityType.LOCAL_KEY,
					pubkey: identity.pubkey,
					label: identity.label,
					createdAt: identity.createdAt,
					lastUsedAt: identity.lastUsedAt,
					relays: identity.relays,
					wrappedDataKey: stateWrappedDataKey,
					localSecret: Capacitor.isNativePlatform()
						? {
							storage: "secure_ref",
							localKeyRef: await setLocalPrivateKey(identity.pubkey, privKey),
						}
						: {
							storage: "inline_encrypted",
							scheme: "app-password-only-v1",
							passwordMode: "default",
							encryptedPrivkey: await encryptLocalPrivateKeyForWeb(privKey),
						},
				};
				return { pubkey: identity.pubkey, identity: newIdentity, topics: topicIds };
			}
			case IdentityType.SANCTUM: {
				const { dataKey, encodedKey } = await generateAndEncodeDataKey();

				const legacyAccessToken = identity.accessToken;
				const tokensData = await upgradeLegacySanctumIdentity(legacyAccessToken);


				const sdk = createSanctumDK({
					url: SANCTUM_URL,
					tokenDataAdapter: {
						getTokenData: () => tokensData,
						setTokenData: () => { },
						clearTokenData: () => { },
					},
				});

				const wirePublicKey = await sdk.api.getPublicKey();
				if (wirePublicKey !== identity.pubkey) {
					console.error("Error in secure identities migration. Sanctum identity pubkey does not match");
					return {
						pubkey: identity.pubkey,
						identity: null,
						topics: [],
						error: "sanctum identity pubkey does not match",
						failureKind: "terminal",
					};
				}

				const wrappedDataKeyCiphertext = await sdk.api.encrypt(identity.pubkey, encodedKey);
				const stateWrappedDataKey = await toWrappedDataKeyStorage(identity.pubkey, wrappedDataKeyCiphertext);

				const topicIds = await getTopicIdsForIdentity(identity);

				await encryptIdentityScopedSlice({
					identityId: identity.pubkey,
					sliceName: "identity",
					dataKey,
				});
				await encryptIdentityScopedSlice({
					identityId: identity.pubkey,
					sliceName: "sources",
					dataKey,
				});


				const sanctumTokens: SanctumTokensStorage = Capacitor.isNativePlatform()
					? {
						storage: "secure_ref",
						sessionRef: await setSanctumTokensData(identity.pubkey, tokensData),
					}
					: {
						storage: "inline",
						tokensData,
					};
				const newIdentity: IdentitySanctum = {
					type: IdentityType.SANCTUM,
					pubkey: identity.pubkey,
					label: identity.label,
					createdAt: identity.createdAt,
					lastUsedAt: identity.lastUsedAt,
					wrappedDataKey: stateWrappedDataKey,
					sanctumTokens,
				};
				return { pubkey: identity.pubkey, identity: newIdentity, topics: topicIds };
			}
			case IdentityType.NIP07: {
				const { dataKey, encodedKey } = await generateAndEncodeDataKey();

				const extensionApi = await getNostrExtensionIdentityApi();
				const extensionKey = await extensionApi.getPublicKey();
				if (extensionKey !== identity.pubkey) {
					console.error("Error in secure identities migration. Nostr extension identity pubkey does not match");
					return {
						pubkey: identity.pubkey,
						identity: null,
						topics: [],
						error: "nostr extension identity pubkey does not match",
						failureKind: "terminal"
					};
				}
				const wrappedDataKeyCiphertext = await extensionApi.encrypt(identity.pubkey, encodedKey);
				const stateWrappedDataKey = await toWrappedDataKeyStorage(identity.pubkey, wrappedDataKeyCiphertext);
				const topicIds = await getTopicIdsForIdentity(identity);


				await encryptIdentityScopedSlice({
					identityId: identity.pubkey,
					sliceName: "identity",
					dataKey,
				});
				await encryptIdentityScopedSlice({
					identityId: identity.pubkey,
					sliceName: "sources",
					dataKey,
				});

				const newIdentity: IdentityExtension = {
					type: IdentityType.NIP07,
					relays: identity.relays,
					pubkey: identity.pubkey,
					label: identity.label,
					createdAt: identity.createdAt,
					lastUsedAt: identity.lastUsedAt,
					wrappedDataKey: stateWrappedDataKey,
				};

				return { pubkey: identity.pubkey, identity: newIdentity, topics: topicIds };
			}
			default:
				return {
					pubkey,
					identity: null,
					topics: [],
					error: "unsupported identity type",
					failureKind: "terminal",
				};
		}
	} catch (error) {
		console.error("Error in secure identities migration", {
			pubkey: identity.pubkey,
			type: identity.type,
			error,
		});
		return {
			pubkey: identity.pubkey,
			identity: null,
			topics: [],
			error: error instanceof Error ? error.message : String(error),
			failureKind: "retryable",
		};
	}
}

async function encryptIdentityScopedSlice(args: {
	identityId: string;
	sliceName: "identity" | "sources";
	dataKey: CryptoKey;
}) {
	const persistKey = args.sliceName === "identity"
		? `persist:${getScopedIdentityPersistKey(args.identityId)}`
		: `persist:${getScopedSourcesPersistKey(args.identityId)}`;

	const raw = await IonicStorageAdapter.getItem(persistKey);
	if (!raw) return;
	try {
		const parsed = JSON.parse(raw);
		if (isAesGcmEnvelope(parsed)) return;
	} catch {
		// legacy plaintext; encrypt below
	}
	const envelope = await encryptStringAesGcm({
		key: args.dataKey,
		plaintext: raw,
		aad: {
			identityId: args.identityId,
			sliceName: args.sliceName,
		},
	});
	await IonicStorageAdapter.setItem(persistKey, JSON.stringify(envelope));
}


async function generateAndEncodeDataKey(): Promise<{ dataKey: CryptoKey; encodedKey: string }> {
	const dataKey = await generateAesGcmKey();
	const bufferKey = await exportAesGcmKey(dataKey);
	const encodedKey = base64urlEncode(bufferKey);
	return { dataKey, encodedKey };
}



// For an identity, get all the topic ids of the sources that it has.
async function getTopicIdsForIdentity(identity: IdentityV0): Promise<{ topicId: string; sourceId: string }[]> {
	const sourcesSliceSerialized = await IonicStorageAdapter.getItem("persist:" + getScopedSourcesPersistKey(identity.pubkey));
	if (!sourcesSliceSerialized) return [];
	let parsedOnce: unknown;
	try {
		parsedOnce = JSON.parse(sourcesSliceSerialized);
	} catch {
		return [];
	}
	if (isAesGcmEnvelope(parsedOnce)) return [];

	// redux-persist stores a JSON object whose fields are themselves JSON strings.
	const parsedTwice: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(parsedOnce as Record<string, unknown>)) {
		if (typeof value !== "string") {
			parsedTwice[key] = value;
			continue;
		}
		try {
			parsedTwice[key] = JSON.parse(value);
		} catch {
			parsedTwice[key] = value;
		}
	}

	const metadataEntities = ((parsedTwice as unknown as SourcesState).metadata?.entities ?? {}) as SourcesState["metadata"]["entities"];
	return Object.values(metadataEntities)
		.filter((meta): meta is NonNullable<typeof meta> => Boolean(meta))
		.filter((meta) => Boolean(meta.topicId))
		.map((meta) => ({ topicId: meta.topicId!, sourceId: meta.id }));
}
