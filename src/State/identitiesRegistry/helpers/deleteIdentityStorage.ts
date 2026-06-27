import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { getScopedIdentityPersistKey } from "@/State/scoped/backups/identity/slice";
import { getScopedSourcesPersistKey } from "@/State/scoped/backups/sources/slice";
import {
	SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY,
	type SecureIdentitiesMigrationJournal,
} from "./migrateToSecureIdentities";
import {
	deleteLocalPrivateKey,
	deleteSanctumSession,
	deleteWrappedDataKeyCiphertext,
} from "./secureSecrets";
import { IdentityType, type Identity } from "../types";

export async function deleteIdentityScopedPersist(pubkey: string): Promise<void> {
	await IonicStorageAdapter.removeItem(`persist:${getScopedIdentityPersistKey(pubkey)}`);
	await IonicStorageAdapter.removeItem(`persist:${getScopedSourcesPersistKey(pubkey)}`);
}

export async function deleteIdentitySecureSecrets(identity: Identity): Promise<void> {
	if (identity.wrappedDataKey.storage === "secure_ref") {
		await deleteWrappedDataKeyCiphertext(identity.wrappedDataKey.wrappedDataKeyRef);
	}

	if (identity.type === IdentityType.LOCAL_KEY && identity.localSecret.storage === "secure_ref") {
		await deleteLocalPrivateKey(identity.localSecret.localKeyRef);
	}

	if (
		identity.type === IdentityType.SANCTUM &&
		identity.sanctumTokens?.storage === "secure_ref"
	) {
		await deleteSanctumSession(identity.sanctumTokens.sessionRef);
	}
}

export async function clearIdentityMigrationJournalEntry(pubkey: string): Promise<void> {
	const raw = await IonicStorageAdapter.getItem(SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY);
	if (!raw) return;

	try {
		const journal = JSON.parse(raw) as SecureIdentitiesMigrationJournal;
		if (!journal.byPubkey[pubkey]) return;
		delete journal.byPubkey[pubkey];
		await IonicStorageAdapter.setItem(
			SECURE_IDENTITIES_MIGRATION_JOURNAL_KEY,
			JSON.stringify(journal),
		);
	} catch {
		// ignore malformed journal
	}
}

export async function deleteIdentityPersistedData(identity: Identity): Promise<void> {
	await deleteIdentityScopedPersist(identity.pubkey);
	await deleteIdentitySecureSecrets(identity);
	await clearIdentityMigrationJournalEntry(identity.pubkey);
}
