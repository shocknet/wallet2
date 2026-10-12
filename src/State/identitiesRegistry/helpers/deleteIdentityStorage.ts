import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { identityModule } from "@/State/scoped/backups/identity/slice";
import { sourcesModule } from "@/State/scoped/backups/sources/slice";
import { beaconsModule, getLegacyScopedBeaconsPersistKey } from "@/State/scoped/beacons/slice";
import { removePendingV0Identity } from "@/shell/migrations/secureIdentities/pendingV0";
import {
	deleteLocalPrivateKey,
	deleteWrappedDataKeyCiphertext,
} from "./secureSecrets";
import { deleteSanctumTokens } from "./sanctumTokensStore";
import { IdentityType, type Identity } from "../types";

export async function deleteIdentityScopedPersist(pubkey: string): Promise<void> {
	await IonicStorageAdapter.removeItem(`persist:${identityModule.persistKey(pubkey)}`);
	await IonicStorageAdapter.removeItem(`persist:${sourcesModule.persistKey(pubkey)}`);
	await IonicStorageAdapter.removeItem(`persist:${beaconsModule.persistKey(pubkey)}`);
	await deleteLegacyBeaconsPersist(pubkey);
}

export async function deleteLegacyBeaconsPersist(pubkey: string): Promise<void> {
	await IonicStorageAdapter.removeItem(`persist:${getLegacyScopedBeaconsPersistKey(pubkey)}`);
}

export async function deleteIdentitySecureSecrets(identity: Identity): Promise<void> {
	if (identity.wrappedDataKey.storage === "secure_ref") {
		await deleteWrappedDataKeyCiphertext(identity.wrappedDataKey.wrappedDataKeyRef);
	}

	if (identity.type === IdentityType.LOCAL_KEY && identity.localSecret.storage === "secure_ref") {
		await deleteLocalPrivateKey(identity.localSecret.localKeyRef);
	}

	if (identity.type === IdentityType.SANCTUM) {
		await deleteSanctumTokens(identity.pubkey);
	}
}

export async function deleteIdentityPersistedData(identity: Identity): Promise<void> {
	await deleteIdentityScopedPersist(identity.pubkey);
	await deleteIdentitySecureSecrets(identity);
	await removePendingV0Identity(identity.pubkey);
}
