import type { AppThunk, AppThunkDispatch, RootState } from "@/State/store/store";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";
import {
	isSecureIdentity,
} from "@/State/identitiesRegistry/types";
import { deleteIdentityScopedPersist } from "@/State/identitiesRegistry/helpers/deleteIdentityStorage";
import {
	SecureIdentitiesMigrationError,
	toSecureIdentitiesMigrationFailure,
	type SecureIdentitiesMigrationFailure,
} from "./errors";
import type { IdentityV0 } from "./identityV0";
import { migrateV0IdentityToSecure } from "./migrateIdentity";
import {
	readPendingV0Identities,
	removePendingV0Identity,
	writePendingV0Identities,
} from "./pendingV0";

export type { IdentityV0, IdentityKeysV0, IdentityExtensionV0, IdentitySanctumV0 } from "./identityV0";

export type { SecureIdentitiesMigrationFailure } from "./errors";
export type { SecureIdentitiesRepairAction } from "./errors";
export {
	secureIdentitiesFailureTitle,
	secureIdentitiesFailureDetail,
	secureIdentitiesRepairLabel,
} from "./failures";
export { toSecureIdentitiesMigrationFailure } from "./errors";

export type SecureIdentitiesMigrationOutcome = "migrated" | "skipped";

export type SecureIdentitiesMigrationResult =
	| { ok: true; outcome: SecureIdentitiesMigrationOutcome }
	| { ok: false; failure: SecureIdentitiesMigrationFailure };


export const runSecureIdentitiesMigration = (): AppThunk<
	Promise<SecureIdentitiesMigrationResult>
> => async (dispatch, getState) => {
	try {
		const pending = await quarantineInsecureIdentities(dispatch, getState);

		if (pending.length === 0) {
			return { ok: true, outcome: "skipped" };
		}

		for (const identity of pending) {
			try {
				const { identity: secureIdentity, topics } =
					await migrateV0IdentityToSecure(identity);

				dispatch(
					identitiesRegistryActions._upsertIdentity({
						identity: secureIdentity,
					}),
				);

				for (const topic of topics) {
					dispatch(
						identitiesRegistryActions.setTopicIdIndex({
							identityId: secureIdentity.pubkey,
							topicId: topic.topicId,
							sourceId: topic.sourceId,
						}),
					);
				}

				await removePendingV0Identity(identity.pubkey);
			} catch (error) {
				return {
					ok: false,
					failure: toSecureIdentitiesMigrationFailure(
						error,
						identity.pubkey,
					),
				};
			}
		}

		return { ok: true, outcome: "migrated" };
	} catch (error) {
		return {
			ok: false,
			failure: toSecureIdentitiesMigrationFailure(error),
		};
	}
};

/**
 * Drop the failing V0 from quarantine (+ scoped persist) and continue.
 * Registry is already secure-only for this pubkey.
 */
export async function continueFreshAfterSecureIdentitiesFailure(
	failure: SecureIdentitiesMigrationFailure,
): Promise<void> {
	if (!failure.pubkey) {
		throw new SecureIdentitiesMigrationError(
			"unknown",
			"Cannot continue-fresh without a failing identity pubkey.",
			"",
		);
	}

	await deleteIdentityScopedPersist(failure.pubkey);
	await removePendingV0Identity(failure.pubkey);
}

async function quarantineInsecureIdentities(
	dispatch: AppThunkDispatch,
	getState: () => RootState,
): Promise<IdentityV0[]> {
	try {
		const existingBag = await readPendingV0Identities();
		const byPubkey = new Map(
			existingBag.map((identity) => [identity.pubkey, identity]),
		);

		const state = getState();
		for (const entity of Object.values(state.identitiesRegistry.entities)) {
			if (!entity) {
				continue;
			}
			if (isSecureIdentity(entity)) {
				continue;
			}

			const v0 = entity as unknown as IdentityV0;
			byPubkey.set(v0.pubkey, v0);


			if (state.identitiesRegistry.lastActiveIdentityId === v0.pubkey) {
				dispatch(identitiesRegistryActions.clearLastActiveIdentityId());
			}
			dispatch(
				identitiesRegistryActions.removeIdentity({ pubkey: v0.pubkey }),
			);
		}

		const pending = [...byPubkey.values()];
		await writePendingV0Identities(pending);
		return pending;
	} catch (error) {
		throw new SecureIdentitiesMigrationError(
			"storage-failed",
			error instanceof Error
				? error.message
				: "Could not quarantine insecure identities.",
			"",
			{ cause: error },
		);
	}
}
