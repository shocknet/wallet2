import { useState } from "react";
import { useAppDispatch } from "@/State/store/hooks";
import { repairSecureIdentitiesMigration } from "../coordinator";
import type { SecureIdentitiesMigrationFailure } from "../migrations/secureIdentities/errors";
import type { SecureIdentitiesRepairAction } from "../types";
import {
	secureIdentitiesFailureDetail,
	secureIdentitiesFailureTitle,
	secureIdentitiesRepairLabel,
} from "../migrations/secureIdentities/failures";
import { ShellFailureLayout } from "./ShellFailureLayout";

export function SecureIdentitiesMigrationFailedScreen({
	failure,
}: {
	failure: SecureIdentitiesMigrationFailure;
}) {
	const dispatch = useAppDispatch();
	const [busyAction, setBusyAction] =
		useState<SecureIdentitiesRepairAction | null>(null);

	async function handleRepair(action: SecureIdentitiesRepairAction) {
		if (busyAction) {
			return;
		}

		setBusyAction(action);
		try {
			await dispatch(
				repairSecureIdentitiesMigration(failure, action),
			);
		} finally {
			setBusyAction(null);
		}
	}

	return (
		<ShellFailureLayout
			title={secureIdentitiesFailureTitle(failure)}
			message={failure.message}
			detail={secureIdentitiesFailureDetail(failure)}
			meta={
				failure.pubkey ? (
					<p className="font-mono text-xs text-faint break-all">
						{failure.pubkey}
					</p>
				) : null
			}
			actions={failure.repairActions.map((action) => ({
				key: action,
				label: secureIdentitiesRepairLabel(action),
				primary: action === "retry",
				disabled: busyAction !== null,
				busy: busyAction === action,
				onClick: () => void handleRepair(action),
			}))}
		/>
	);
}
