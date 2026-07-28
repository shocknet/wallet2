import type { AppThunk } from "@/State/store/store";
import {
	runDeviceToIdentitiesMigration,
	type DeviceToIdentitiesMigrationFailure,
} from "./migrations/deviceToIdentities";
import {
	runSecureIdentitiesMigration,
	type SecureIdentitiesMigrationFailure,
} from "./migrations/secureIdentities";
import type { MigrationFailure } from "./types";

export type MigrationResult =
	| { ok: true }
	| { ok: false; failure: MigrationFailure };

export const runShellMigrations =
	(): AppThunk<Promise<MigrationResult>> => async (dispatch) => {
		const deviceToIdentitiesResult = await dispatch(runDeviceToIdentitiesMigration());
		if (!deviceToIdentitiesResult.ok) {
			return deviceToIdentitiesResult;
		}

		const secureIdentitiesResult = await dispatch(runSecureIdentitiesMigration());
		if (!secureIdentitiesResult.ok) {
			return secureIdentitiesResult;
		}

		return { ok: true };
	};

export function isDeviceToIdentitiesMigrationFailure(
	failure: MigrationFailure,
): failure is DeviceToIdentitiesMigrationFailure {
	return failure.migration === "device-to-identities-migration";
}

export function isSecureIdentitiesMigrationFailure(
	failure: MigrationFailure,
): failure is SecureIdentitiesMigrationFailure {
	return failure.migration === "secure-identities-migration";
}
