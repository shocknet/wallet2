export type SecureIdentitiesMigrationErrorCode =
	| "local-key-mismatch"
	| "sanctum-pubkey-mismatch"
	| "sanctum-token-missing"
	| "sanctum-upgrade-failed"
	| "sanctum-upgrade-network-failed"
	| "extension-unavailable"
	| "extension-profile-mismatch"
	| "scoped-encrypt-failed"
	| "wrap-data-key-failed"
	| "unsupported-identity"
	| "storage-failed"
	| "unknown";

export type SecureIdentitiesRepairAction = "retry" | "continue-fresh";

export type SecureIdentitiesMigrationFailure = {
	migration: "secure-identities-migration";
	code: SecureIdentitiesMigrationErrorCode;
	message: string;
	repairActions: SecureIdentitiesRepairAction[];
	pubkey: string;
};

export class SecureIdentitiesMigrationError extends Error {
	readonly name = "SecureIdentitiesMigrationError";

	constructor(
		readonly code: SecureIdentitiesMigrationErrorCode,
		message: string,
		readonly pubkey: string,
		options?: { cause?: unknown },
	) {
		super(message, options);
	}
}

function repairActionsForCode(
	code: SecureIdentitiesMigrationErrorCode,
): SecureIdentitiesRepairAction[] {
	switch (code) {
		case "sanctum-upgrade-network-failed":
		case "extension-unavailable":
		case "storage-failed":
		case "scoped-encrypt-failed":
		case "wrap-data-key-failed":
			return ["retry"];
		case "local-key-mismatch":
		case "sanctum-pubkey-mismatch":
		case "sanctum-token-missing":
		case "unsupported-identity":
			return ["continue-fresh"];
		case "extension-profile-mismatch":
		case "sanctum-upgrade-failed":
		default:
			return ["retry", "continue-fresh"];
	}
}

export function toSecureIdentitiesMigrationFailure(
	error: unknown,
	fallbackPubkey = "",
): SecureIdentitiesMigrationFailure {
	if (error instanceof SecureIdentitiesMigrationError) {
		return {
			migration: "secure-identities-migration",
			code: error.code,
			message: error.message,
			repairActions: repairActionsForCode(error.code),
			pubkey: error.pubkey,
		};
	}

	const message = error instanceof Error ? error.message : String(error);

	return {
		migration: "secure-identities-migration",
		code: "unknown",
		message: message || "an unknown error occurred",
		repairActions: repairActionsForCode("unknown"),
		pubkey: fallbackPubkey,
	};
}
