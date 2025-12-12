import { HAS_MIGRATED_TO_IDENTITIES_STORAGE_KEY, NOSTR_PRIVATE_KEY_STORAGE_KEY } from "./constants";
import { migrateDeviceToIdentities } from "./State/identitiesRegistry/identitiesMigration";
import { LAST_ACTIVE_IDENTITY_PUBKEY_KEY, switchIdentity } from "./State/identitiesRegistry/thunks";
import store from "./State/store/store";
import IonicStorageAdapter from "./storage/redux-persist-ionic-storage-adapter";
import { initialState as backupInitialState } from "@/State/Slices/backupState";




export default async function onBeforeLift() {
	const didMigrate = await doIdentityMigration();

	if (!didMigrate) {
		await preloadLastActiveIdentity();
	}
}

async function doIdentityMigration() {
	const exists = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
	const hasRanMigration = await IonicStorageAdapter.getItem(HAS_MIGRATED_TO_IDENTITIES_STORAGE_KEY)

	try {
		if (exists || !hasRanMigration) {
			localStorage.removeItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);
			await store.dispatch(migrateDeviceToIdentities());
			return true;
		}

		return false;
	} catch (err: any) {
		const subbedToBackUp = backupInitialState;
		if (subbedToBackUp.subbedToBackUp) {
			if (subbedToBackUp.usingSanctum) {
				alert(
					`An error occured with Sanctum: \n\n ${err?.message || ""}`
				);
			} else if (subbedToBackUp.usingExtension) {
				alert(
					`An error occured with NIP07 extension: \n\n ${err?.message || ""}`
				);
			} else {
				alert(
					`An un known error occured: \n\n ${err?.message || ""}`
				);
			}
		} else {
			alert(
				`An un known error occured: \n\n ${err?.message || ""}`
			);
		}
		await new Promise(() => {/*  */ });
	}
}

async function preloadLastActiveIdentity() {
	const pubkey = localStorage.getItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);

	if (pubkey) {
		try {
			await store.dispatch(switchIdentity(pubkey, true))
		} catch {
			localStorage.removeItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);
			window.location.reload();
			await new Promise(() => {/*  */ })
		}
	}
}

