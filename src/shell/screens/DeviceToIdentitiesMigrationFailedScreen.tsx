import { useState } from "react";
import { useAppDispatch } from "@/State/store/hooks";
import { repairDeviceToIdentitiesMigration } from "../coordinator";
import type { DeviceToIdentitiesMigrationFailure } from "../migrations/deviceToIdentities/errors";
import type { DeviceToIdentitiesRepairAction } from "../types";
import {
	deviceToIdentitiesFailureDetail,
	deviceToIdentitiesFailureTitle,
	deviceToIdentitiesRepairLabel,
} from "../migrations/deviceToIdentities/failures";
import { ShellFailureLayout } from "./ShellFailureLayout";

export function DeviceToIdentitiesMigrationFailedScreen({
	failure,
}: {
	failure: DeviceToIdentitiesMigrationFailure;
}) {
	const dispatch = useAppDispatch();
	const [busyAction, setBusyAction] =
		useState<DeviceToIdentitiesRepairAction | null>(null);

	async function handleRepair(action: DeviceToIdentitiesRepairAction) {
		if (busyAction) {
			return;
		}

		setBusyAction(action);

		try {
			await dispatch(
				repairDeviceToIdentitiesMigration(failure, action),
			);
		} finally {
			setBusyAction(null);
		}
	}

	return (
		<ShellFailureLayout
			title={deviceToIdentitiesFailureTitle(failure)}
			message={failure.message}
			detail={deviceToIdentitiesFailureDetail(failure)}
			actions={failure.repairActions.map((action) => ({
				key: action,
				label: deviceToIdentitiesRepairLabel(action),
				primary: action === "retry",
				disabled: busyAction !== null,
				busy: busyAction === action,
				onClick: () => void handleRepair(action),
			}))}
		/>
	);
}
