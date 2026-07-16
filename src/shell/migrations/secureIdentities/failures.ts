import type {
	SecureIdentitiesMigrationFailure,
	SecureIdentitiesRepairAction,
} from "./errors";

export function secureIdentitiesFailureTitle(
	failure: SecureIdentitiesMigrationFailure,
): string {
	switch (failure.code) {
		case "local-key-mismatch":
			return "Local key does not match this profile";
		case "sanctum-pubkey-mismatch":
			return "Sanctum account does not match this profile";
		case "sanctum-token-missing":
			return "Sanctum sign-in required";
		case "sanctum-upgrade-failed":
			return "Could not upgrade Sanctum access";
		case "sanctum-upgrade-network-failed":
			return "Could not reach Sanctum";
		case "extension-unavailable":
			return "Nostr extension not available";
		case "extension-profile-mismatch":
			return "Extension profile mismatch";
		case "scoped-encrypt-failed":
			return "Could not encrypt profile data";
		case "wrap-data-key-failed":
			return "Could not secure profile encryption key";
		case "unsupported-identity":
			return "This profile cannot be upgraded";
		case "storage-failed":
			return "Could not save upgrade progress";
		default:
			return "Identity upgrade failed";
	}
}

export function secureIdentitiesFailureDetail(
	failure: SecureIdentitiesMigrationFailure,
): string | undefined {
	switch (failure.code) {
		case "extension-unavailable":
			return "Install or unlock your Nostr extension, then try again.";
		case "extension-profile-mismatch":
			return "Switch the extension to this profile’s account and try again, or remove this profile and continue.";
		case "sanctum-upgrade-network-failed":
			return "Check your connection and try again.";
		case "local-key-mismatch":
		case "sanctum-pubkey-mismatch":
		case "unsupported-identity":
			return "This profile cannot be upgraded safely and will be removed if you continue.";
		default:
			return undefined;
	}
}

export function secureIdentitiesRepairLabel(
	action: SecureIdentitiesRepairAction,
): string {
	switch (action) {
		case "retry":
			return "Try again";
		case "continue-fresh":
			return "Remove this profile and continue";
	}
}
