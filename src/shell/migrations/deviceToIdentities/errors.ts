
export type DeviceToIdentitiesMigrationFailure = {
	migration: "device-to-identities-migration";
	code: DeviceToIdentitiesMigrationErrorCode;
	message: string;
	repairActions: DeviceToIdentitiesRepairAction[];
	legacyBackupKind: LegacyBackupKind;
};

export type DeviceToIdentitiesMigrationErrorCode =
	| "legacy-backup-state-corrupt"
	| "sanctum-token-missing"
	| "sanctum-upgrade-failed"
	| "sanctum-upgrade-network-failed"
	| "extension-unavailable"
	| "extension-not-initialized"
	| "legacy-backup-inconsistent"
	| "create-identity-failed"
	| "legacy-sources-absorb-failed"
	| "storage-failed"
	| "unknown";

export type DeviceToIdentitiesRepairAction = "retry" | "continue-fresh";

export type LegacyBackupKind =
	| "none"
	| "sanctum"
	| "extension"
	| "corrupt"
	| "unknown";

export class DeviceToIdentitiesMigrationError extends Error {
	readonly name = "ToIdentitiesMigrationError";

	constructor(
		readonly code: DeviceToIdentitiesMigrationErrorCode,
		message: string,
		readonly legacyBackupKind: LegacyBackupKind,
		options?: { cause?: unknown },
	) {
		super(message, options);
	}
}

function repairActionsForCode(
	code: DeviceToIdentitiesMigrationErrorCode,
): DeviceToIdentitiesRepairAction[] {
	switch (code) {
		case "storage-failed":
		case "sanctum-upgrade-network-failed":
		case "extension-unavailable":
		case "extension-not-initialized":
			return ["retry"];
		case "legacy-backup-inconsistent":
		case "sanctum-token-missing":
			return ["continue-fresh"];
		default:
			return ["retry", "continue-fresh"];
	}
}

export function toDeviceToIdentitiesMigrationFailure(
	error: unknown,
): DeviceToIdentitiesMigrationFailure {
	if (error instanceof DeviceToIdentitiesMigrationError) {
		return {
			migration: "device-to-identities-migration",
			code: error.code,
			message: error.message,
			repairActions: repairActionsForCode(error.code),
			legacyBackupKind: error.legacyBackupKind,
		};
	}

	const message = error instanceof Error ? error.message : String(error);

	return {
		migration: "device-to-identities-migration",
		code: "unknown",
		message: message || "an unknown error occurred",
		repairActions: repairActionsForCode("unknown"),
		legacyBackupKind: "unknown",
	};
}
