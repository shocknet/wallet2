import type {
	AppThunk,
} from "@/State/store/store";
import { type TokensData } from "sanctum-sdk";
import {
	IdentityType,
} from "../State/identitiesRegistry/types";
import { switchIdentity } from "../State/identitiesRegistry/thunks";
import { selectIdentities } from "../State/identitiesRegistry/slice";
import { clearSanctumReauthRequired } from "../State/identitiesRegistry/identitySyncThunks";
import { shellActions } from "./slice";
import { runShellMigrations } from "./migrations";
import {
	continueFreshAfterDeviceToIdentitiesFailure,
	drainPendingDeviceToIdentitiesLocalSources,
	type DeviceToIdentitiesMigrationFailure,
} from "./migrations/deviceToIdentities";
import {
	continueFreshAfterSecureIdentitiesFailure,
} from "./migrations/secureIdentities";
import type {
	DeviceToIdentitiesRepairAction,
	RuntimeIdentity,
	SecureIdentitiesRepairAction,
	UnlockReason,
} from "./types";
import type { SecureIdentitiesMigrationFailure } from "./migrations/secureIdentities/errors";
import { selectIdentitySession } from "./selectors";
import { resolveStartupIdentityTarget } from "./resolveStartupIdentity";
import { materializePushIntent } from "./pushIntent";
import dLogger from "@/Api/helpers/debugLog";
import { getIdentityNostrApi } from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { clearSanctumIdentitySdk } from "@/State/identitiesRegistry/helpers/sanctumIdentitySdkManager";
import { readSanctumTokens, writeSanctumTokens } from "@/State/identitiesRegistry/helpers/sanctumTokensStore";





export const startShell =
	(): AppThunk<Promise<void>> => async (dispatch) => {
		dispatch(shellActions.migrationStarted());

		const migrationResult = await dispatch(runShellMigrations());

		if (!migrationResult.ok) {
			dispatch(
				shellActions.migrationFailed({
					failure: migrationResult.failure,
				}),
			);
			return;
		}

		dispatch(continueAfterMigrationSuccess());
	};

export const retryShellMigration =
	(): AppThunk<Promise<void>> => async (dispatch) => {
		await dispatch(startShell());
	};

export const repairDeviceToIdentitiesMigration =
	(
		_failure: DeviceToIdentitiesMigrationFailure,
		action: DeviceToIdentitiesRepairAction,
	): AppThunk<Promise<void>> =>
		async (dispatch) => {
			if (action === "continue-fresh") {
				await continueFreshAfterDeviceToIdentitiesFailure();
				dispatch(continueAfterMigrationSuccess());
				return;
			}

			await dispatch(retryShellMigration());
		};

export const repairSecureIdentitiesMigration =
	(
		failure: SecureIdentitiesMigrationFailure,
		action: SecureIdentitiesRepairAction,
	): AppThunk<Promise<void>> =>
		async (dispatch) => {
			if (action === "continue-fresh") {
				await continueFreshAfterSecureIdentitiesFailure(failure);
				await dispatch(startShell());
				return;
			}

			await dispatch(retryShellMigration());
		};

const continueAfterMigrationSuccess =
	(): AppThunk<void> => (dispatch, getState) => {
		dispatch(shellActions.migrationSucceeded());

		const state = getState();

		if (selectIdentities(state).length === 0) {
			dispatch(shellActions.pushIntentCleared());
			dispatch(shellActions.startupIdentityResolved());
			return;
		}

		const target = resolveStartupIdentityTarget(state);

		if (target) {
			dispatch(
				shellActions.identityUnlockRequested({
					identityId: target.identityId,
					reason: target.reason,
				}),
			);
		} else {
			dispatch(shellActions.identitySessionCleared());
		}

		if (!target || target.source !== "push") {
			dispatch(shellActions.pushIntentCleared());
		}

		dispatch(shellActions.startupIdentityResolved());
	};

export const proceedAfterIdentityUnlocked = (
	runtimeIdentity: RuntimeIdentity,
): AppThunk<Promise<void>> => async (dispatch) => {
	const verification = await dispatch(verifySanctumSession(
		runtimeIdentity,
	));

	if (!verification.ok) {
		dispatch(
			shellActions.sanctumReauthRequired({
				runtimeIdentity,
				reason: verification.reason,
			}),
		);
		return;
	}

	await dispatch(completeShellIdentityLoad(runtimeIdentity));
};

export const requestIdentityUnlock =
	(input: {
		identityId: string;
		reason: UnlockReason;
	}): AppThunk<void> =>
		(dispatch) => {
			dispatch(
				shellActions.identityUnlockRequested({
					identityId: input.identityId,
					reason: input.reason,
				}),
			);
		};

export const cancelIdentityUnlock = (): AppThunk<void> => (dispatch) => {
	dispatch(shellActions.identitySessionCleared());
	dispatch(shellActions.pushIntentCleared());
};


export const completeShellIdentityLoad = (
	runtimeIdentity: RuntimeIdentity,
): AppThunk<Promise<void>> => async (dispatch) => {
	const log = dLogger.withContext({
		procedure: "complete-shell-identity-load",
		data: { pubkey: runtimeIdentity.pubkey },
	});

	dispatch(
		shellActions.identityLoadingStarted({
			identityId: runtimeIdentity.pubkey,
		}),
	);

	try {
		await dispatch(switchIdentity(runtimeIdentity));
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load this profile";
		log.error("identity-load-failed", { message, error });
		dispatch(
			shellActions.identityLoadFailed({
				identityId: runtimeIdentity.pubkey,
				message,
			}),
		);
		dispatch(shellActions.pushIntentCleared());
		return;
	}

	try {
		await dispatch(drainPendingDeviceToIdentitiesLocalSources());
	} catch (error) {
		log.error("drain-pending-local-sources-failed", { error });
	}

	dispatch(materializePushIntent());
	dispatch(shellActions.identitySessionCleared());
};




export const completeSanctumReauth =
	(tokensData: TokensData): AppThunk<Promise<void>> =>
		async (dispatch, getState) => {
			const session = selectIdentitySession(getState());

			if (session.kind !== "sanctum-reauth") {
				return;
			}

			const runtimeIdentity = session.runtimeIdentity;

			if (runtimeIdentity.type !== IdentityType.SANCTUM) {
				dispatch(shellActions.identitySessionCleared());
				return;
			}

			await writeSanctumTokens(runtimeIdentity.pubkey, tokensData);
			clearSanctumIdentitySdk(runtimeIdentity.pubkey);
			const copy = { ...runtimeIdentity, reauthReason: null };
			const verification = await dispatch(verifySanctumSession(copy));

			if (!verification.ok) {
				throw new Error(verification.reason); // should never happen
			}


			await dispatch(completeShellIdentityLoad(copy));
		};



export const verifySanctumSession =
	(runtimeIdentity: RuntimeIdentity): AppThunk<Promise<{ ok: true } | { ok: false; reason: string }>> =>
		async (dispatch) => {
			if (runtimeIdentity.type !== IdentityType.SANCTUM) {
				return {
					ok: true,
				};
			}

			if (runtimeIdentity.reauthReason) {
				return {
					ok: false,
					reason: runtimeIdentity.reauthReason,
				};
			}

			const tokens = await readSanctumTokens(runtimeIdentity.pubkey);
			if (!tokens) {
				return {
					ok: false,
					reason: "Sanctum reauth required",
				};
			}

			try {
				await getIdentityNostrApi(runtimeIdentity);
				dispatch(clearSanctumReauthRequired({ pubkey: runtimeIdentity.pubkey }));
				return { ok: true };
			} catch (error) {
				return {
					ok: false,
					reason: error instanceof Error
						? error.message
						: "Sanctum session is not valid",
				};

			}
		}

