import type {
	DeviceToIdentitiesMigrationFailure,
	DeviceToIdentitiesRepairAction,
} from "./errors";

export function deviceToIdentitiesFailureTitle(
	failure: DeviceToIdentitiesMigrationFailure,
): string {
	switch (failure.code) {
		case "legacy-backup-state-corrupt":
			return "Legacy backup settings could not be read";
		case "sanctum-token-missing":
			return "Sanctum sign-in required";
		case "sanctum-upgrade-failed":
			return "Could not upgrade Sanctum access";
		case "sanctum-upgrade-network-failed":
			return "Could not reach Sanctum";
		case "extension-unavailable":
			return "Nostr extension not available";
		case "extension-not-initialized":
			return "Nostr extension not set up";
		case "legacy-backup-inconsistent":
			return "Legacy backup settings are inconsistent";
		case "create-identity-failed":
			return "Could not create identity";
		case "legacy-sources-absorb-failed":
			return "Could not import legacy sources";
		case "storage-failed":
			return "Could not save migration progress";
		default:
			return "Device migration failed";
	}
}

export function deviceToIdentitiesFailureDetail(
	failure: DeviceToIdentitiesMigrationFailure,
): string | undefined {
	switch (failure.code) {
		case "extension-unavailable":
			return "Install a Nostr browser extension that supports NIP-04 or NIP-44, then try again.";
		case "extension-not-initialized":
			return "Open your Nostr extension and create or import a keypair, then try again.";
		case "sanctum-upgrade-network-failed":
			return "Check your connection and try again.";
		case "sanctum-token-missing":
			return "You can continue without importing legacy Sanctum data and set up a new identity instead.";
		case "legacy-backup-inconsistent":
			return "Legacy backup is enabled but neither Sanctum nor a browser extension is selected.";
		case "legacy-sources-absorb-failed":
			return "Your profile was created, but legacy payment sources could not be imported yet. Unlock and try again, or continue without them.";
		default:
			return undefined;
	}
}

export function deviceToIdentitiesRepairLabel(
	action: DeviceToIdentitiesRepairAction,
): string {
	switch (action) {
		case "retry":
			return "Try again";
		case "continue-fresh":
			return "Continue without legacy data";
	}
}
