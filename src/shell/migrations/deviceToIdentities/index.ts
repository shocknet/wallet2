import { getStateAndVersion } from "@/State/Slices/migrations";
import z from "zod";
import {
	DeviceToIdentitiesMigrationError,
	type DeviceToIdentitiesMigrationFailure,
	toDeviceToIdentitiesMigrationFailure,
	type LegacyBackupKind,
} from "./errors";
import { NOSTR_RELAYS } from "@/constants";
import { AppThunk, AppThunkDispatch, persistor, RootState } from "@/State/store/store";
import {
	applyLocalLegacySourcesIfMissing,
	collectLocalLegacySources,
	type SourceToMigrate,
} from "./legacySources";
import { generateNewKeyPair } from "@/Api/helpers";
import { createIdentity, type CreateIdentityInput } from "@/State/identitiesRegistry/thunks";
import { identitiesSelectors } from "@/State/identitiesRegistry/slice";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { normalizeWsUrl } from "@/lib/url";
import { getSanctumAccessToken } from "@/Api/sanctum";
import { upgradeLegacySanctumAccessToken } from "./sanctumUpgrade";
import { clearLegacyDeviceStorage } from "./cleanupLegacyDeviceStorage";
import { HexKeySchema } from "@/lib/regex";
import { getExtentionsWithRetries } from "@/lib/nip07Extension";
import {
	clearPendingLocalSourcesJournal,
	hasPendingLocalSourcesJournal,
	readPendingLocalSourcesJournal,
	writePendingLocalSourcesJournal,
} from "./pendingLocalSourcesJournal";

export type { DeviceToIdentitiesMigrationFailure } from "./errors";

export type DeviceToIdentitiesMigrationOutcome =
	| "migrated"
	| "purged"
	| "pending-source-drain";

export type DeviceToIdentitiesMigrationResult =
	| { ok: true; outcome: DeviceToIdentitiesMigrationOutcome }
	| { ok: false; failure: DeviceToIdentitiesMigrationFailure };

const legacyBackupStateSchema = z.object({
	subbedToBackUp: z.boolean(),
	usingSanctum: z.boolean(),
	usingExtension: z.boolean(),
});

type LegacyBackupState = z.infer<typeof legacyBackupStateSchema>;

const legacyBackupStateStorageKey = "backupState";

/**
 * Device → identities migration.
 *
 * - No identities yet: classify legacy backup, create identity, absorb local
 *   sources while the new identity is unlocked in-process, then purge legacy.
 * - Identities already exist: purge leftover legacy device storage (older runs
 *   did not always clear it). If a pending local-sources journal exists from a
 *   crashed mid-migrate, leave legacy/journal alone for post-unlock drain.
 */
export const runDeviceToIdentitiesMigration = (): AppThunk<
	Promise<DeviceToIdentitiesMigrationResult>
> => async (dispatch, getState) => {
	try {
		if (hasAnyIdentities(getState)) {
			if (await hasPendingLocalSourcesJournal()) {
				return { ok: true, outcome: "pending-source-drain" };
			}

			await purgeLegacyDeviceStorage();
			return { ok: true, outcome: "purged" };
		}

		await migrateLegacyDeviceToIdentity(dispatch, getState);
		await purgeLegacyDeviceStorage();
		return { ok: true, outcome: "migrated" };
	} catch (error) {
		return {
			ok: false,
			failure: toDeviceToIdentitiesMigrationFailure(error),
		};
	}
};

// Abandon legacy data and clear journal + device-local residue
export async function continueFreshAfterDeviceToIdentitiesFailure(): Promise<void> {
	await clearPendingLocalSourcesJournal();
	await purgeLegacyDeviceStorage();
}

/**
 * Apply journaled local sources after an identity is unlocked/loaded.
 * Clears journal + legacy device storage only after a successful absorb.
 */
export const drainPendingDeviceToIdentitiesLocalSources = (): AppThunk<
	Promise<void>
> => async (dispatch, getState) => {
	const pending = await readPendingLocalSourcesJournal();
	if (pending.length === 0) {
		return;
	}

	if (!getState().identitiesRegistry.active) {
		return;
	}

	applyLocalLegacySourcesIfMissing(dispatch, getState, pending);
	await clearPendingLocalSourcesJournal();
	await purgeLegacyDeviceStorage();
};

async function migrateLegacyDeviceToIdentity(
	dispatch: AppThunkDispatch,
	getState: () => RootState,
): Promise<void> {
	const backup = readLegacyBackupState();
	const legacyKind = getLegacyBackupKind(backup);

	if (legacyKind === "unknown") {
		throw new DeviceToIdentitiesMigrationError(
			"legacy-backup-inconsistent",
			"Legacy backup is enabled but neither Sanctum nor a Nostr extension is selected.",
			"unknown",
		);
	}

	const legacyLocalSources = collectLocalLegacySources();
	if (legacyLocalSources.length > 0) {
		await writePendingLocalSourcesJournal(legacyLocalSources);
	}

	switch (legacyKind) {
		case "none": {
			if (legacyLocalSources.length > 0) {
				// No backup subscription: mint a fresh local keypair to own the
				// orphaned device sources
				const keyPair = generateNewKeyPair();
				await dispatchCreateIdentity(
					dispatch,
					{
						type: IdentityType.LOCAL_KEY,
						privkey: keyPair.privateKey,
						label: "My Nostr pair Identity",
						relays: NOSTR_RELAYS.map(normalizeWsUrl),
					},
					legacyKind,
				);
				absorbLocalLegacySources(
					dispatch,
					getState,
					legacyLocalSources,
					legacyKind,
				);
			}
			break;
		}
		case "sanctum": {
			const legacyAccessToken = getSanctumAccessToken();
			if (!legacyAccessToken) {
				throw new DeviceToIdentitiesMigrationError(
					"sanctum-token-missing",
					"Legacy Sanctum backup is enabled but no access token was found.",
					"sanctum",
				);
			}

			const tokensData =
				await upgradeLegacySanctumAccessToken(legacyAccessToken);
			await dispatchCreateIdentity(
				dispatch,
				{
					type: IdentityType.SANCTUM,
					label: "My Sanctum Identity",
					tokensData,
				},
				legacyKind,
			);
			absorbLocalLegacySources(
				dispatch,
				getState,
				legacyLocalSources,
				legacyKind,
			);
			break;
		}
		case "extension": {
			await verifyExtensionForMigration();
			await dispatchCreateIdentity(
				dispatch,
				{
					type: IdentityType.NIP07,
					label: "My Nostr Extension Identity",
					relays: NOSTR_RELAYS.map(normalizeWsUrl),
				},
				legacyKind,
			);
			absorbLocalLegacySources(
				dispatch,
				getState,
				legacyLocalSources,
				legacyKind,
			);
			break;
		}
	}

	await clearPendingLocalSourcesJournal();
}

async function purgeLegacyDeviceStorage(): Promise<void> {
	try {
		await persistor.flush().catch(() => { });
		clearLegacyDeviceStorage();
	} catch (error) {
		throw new DeviceToIdentitiesMigrationError(
			"storage-failed",
			"Could not clear legacy device storage.",
			"unknown",
			{ cause: error },
		);
	}
}

function hasAnyIdentities(getState: () => RootState): boolean {
	return identitiesSelectors.selectTotal(getState()) > 0;
}

function readLegacyBackupState(): LegacyBackupState | null {
	const stored = localStorage.getItem(legacyBackupStateStorageKey);
	if (!stored) {
		return null;
	}

	try {
		const { state } = getStateAndVersion(stored);
		return legacyBackupStateSchema.parse(state);
	} catch (error) {
		throw new DeviceToIdentitiesMigrationError(
			"legacy-backup-state-corrupt",
			"Legacy backup settings could not be read.",
			"corrupt",
			{ cause: error },
		);
	}
}

function getLegacyBackupKind(
	backup: LegacyBackupState | null,
): LegacyBackupKind {
	if (backup === null) return "none";
	if (!backup.subbedToBackUp) return "none";
	if (backup.usingSanctum) return "sanctum";
	if (backup.usingExtension) return "extension";
	return "unknown";
}

async function dispatchCreateIdentity(
	dispatch: AppThunkDispatch,
	input: CreateIdentityInput,
	legacyKind: LegacyBackupKind,
): Promise<void> {
	try {
		await dispatch(createIdentity(input));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new DeviceToIdentitiesMigrationError(
			"create-identity-failed",
			message,
			legacyKind,
			{ cause: error },
		);
	}
}

function absorbLocalLegacySources(
	dispatch: AppThunkDispatch,
	getState: () => RootState,
	localSources: SourceToMigrate[],
	legacyKind: LegacyBackupKind,
): void {
	if (!localSources.length) {
		return;
	}

	if (!getState().identitiesRegistry.active) {
		throw new DeviceToIdentitiesMigrationError(
			"legacy-sources-absorb-failed",
			"Identity was created but is not active; cannot import legacy sources.",
			legacyKind,
		);
	}

	try {
		applyLocalLegacySourcesIfMissing(dispatch, getState, localSources);
	} catch (error) {
		throw new DeviceToIdentitiesMigrationError(
			"legacy-sources-absorb-failed",
			error instanceof Error
				? error.message
				: "Failed to import legacy sources into the new identity.",
			legacyKind,
			{ cause: error },
		);
	}
}

async function verifyExtensionForMigration(): Promise<void> {
	const ext = await getExtentionsWithRetries();
	if (!ext) {
		throw new DeviceToIdentitiesMigrationError(
			"extension-unavailable",
			"No Nostr browser extension was detected. Install one and try again.",
			"extension",
		);
	}

	if (!ext.nip44 && !ext.nip04) {
		throw new DeviceToIdentitiesMigrationError(
			"extension-unavailable",
			"This Nostr extension does not support the encryption features required by Shockwallet.",
			"extension",
		);
	}

	try {
		const pubkey = await ext.getPublicKey();
		if (!HexKeySchema.safeParse(pubkey).success) {
			throw new Error("Extension returned no valid Nostr public key.");
		}
	} catch (error) {
		throw new DeviceToIdentitiesMigrationError(
			"extension-not-initialized",
			"A Nostr extension is installed but has no account set up yet. Create or import a key in the extension and try again.",
			"extension",
			{ cause: error },
		);
	}
}
