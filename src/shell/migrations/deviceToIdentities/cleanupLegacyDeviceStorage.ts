import { removeSanctumAccessToken } from "@/Api/sanctum";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from "@/constants";
import { storageKey as backupStateStorageKey } from "@/State/Slices/backupState";
import { storageKey as paySourceStorageKey } from "@/State/Slices/paySourcesSlice";
import { storageKey as spendSourceStorageKey } from "@/State/Slices/spendSourcesSlice";

const legacyDeviceLocalStorageKeys = [
	paySourceStorageKey,
	spendSourceStorageKey,
	backupStateStorageKey,
	NOSTR_PRIVATE_KEY_STORAGE_KEY,
] as const;

export function clearLegacyDeviceStorage(): void {
	for (const key of legacyDeviceLocalStorageKeys) {
		localStorage.removeItem(key);
	}

	removeSanctumAccessToken();
}
