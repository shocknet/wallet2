import dLogger from "@/Api/helpers/debugLog";
import { isLegacyBeaconsStorageKey } from "@/State/scoped/beacons/slice";
import type { AppThunk } from "@/State/store/store";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";

const obsoleteScopedPersistStorageKeys = [
	isLegacyBeaconsStorageKey,
];

async function removeObsoleteScopedPersist(): Promise<void> {
	const keys = await IonicStorageAdapter.keys();
	const stale = keys.filter((key) =>
		obsoleteScopedPersistStorageKeys.some((matches) => matches(key)),
	);
	await Promise.all(stale.map((key) => IonicStorageAdapter.removeItem(key)));
}

const maintenanceTasks = [
	{ name: "obsolete-scoped-persist", run: removeObsoleteScopedPersist },
];

export const runMaintenanceMigration = (): AppThunk<Promise<void>> => async () => {
	for (const task of maintenanceTasks) {
		try {
			await task.run();
		} catch (error) {
			dLogger.withContext({ procedure: "maintenance-migration" }).error(
				"task-failed",
				{ error, data: { task: task.name } },
			);
		}
	}
};
