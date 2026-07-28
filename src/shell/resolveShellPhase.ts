import type { ShellPhase, ShellSnapshot } from "./types";
import { isDeviceToIdentitiesMigrationFailure } from "./migrations";

export function resolveShellPhase(snapshot: ShellSnapshot): ShellPhase {
	const {
		migration,
		startupIdentity,
		identitySession,
		identityCount,
		activeIdentity,
	} = snapshot;

	if (migration.kind === "running") {
		return { kind: "starting-up" };
	}

	if (migration.kind === "failed") {
		if (isDeviceToIdentitiesMigrationFailure(migration.failure)) {
			return {
				kind: "device-to-identities-migration-failed",
				failure: migration.failure,
			};
		}

		return {
			kind: "secure-identities-migration-failed",
			failure: migration.failure,
		};
	}

	if (startupIdentity.kind === "resolving") {
		return { kind: "starting-up" };
	}

	switch (identitySession.kind) {
		case "unlock-requested":
			return {
				kind: "unlocking-identity",
				identityId: identitySession.identityId,
				reason: identitySession.reason,
			};

		case "sanctum-reauth":
			return {
				kind: "sanctum-reauth",
				runtimeIdentity: identitySession.runtimeIdentity,
				reason: identitySession.reason,
			};

		case "loading":
			return {
				kind: "loading-identity",
				identityId: identitySession.identityId,
			};

		case "load-failed":
			return {
				kind: "identity-load-failed",
				identityId: identitySession.identityId,
				message: identitySession.message,
			};

		case "none":
			if (activeIdentity) {
				return {
					kind: "ready",
					runtimeIdentity: activeIdentity,
				};
			}

			return identityCount === 0
				? { kind: "identity-gate", initialView: "create" }
				: { kind: "identity-gate", initialView: "select" };
	}


}
