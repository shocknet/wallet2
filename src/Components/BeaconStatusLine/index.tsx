import React from "react";
import { IonIcon, IonSpinner } from "@ionic/react";
import {
	alertCircleOutline,
	checkmarkCircleOutline,
} from "ionicons/icons";
import { BeaconHealth } from "@/State/scoped/backups/sources/selectors";



type Props = {
	state: BeaconHealth;
	showWhenFresh?: boolean;
	labels?: Partial<Record<BeaconHealth, string>>;
};

const DEFAULT_LABELS: Record<BeaconHealth, string> = {
	fresh: "Connected",
	warmingUp: "Reconnecting…",
	stale: "Offline",
};

export const BeaconStatusLine: React.FC<Props> = ({
	state,
	showWhenFresh = false,
	labels,
}) => {
	if (state === "fresh" && !showWhenFresh) return null;

	const text = (labels?.[state] ?? DEFAULT_LABELS[state]);

	if (state === "warmingUp") {
		return (
			<span className="flex items-center justify-start gap-2">
				<IonSpinner name="dots" className="w-4 h-4" />
				<span className="text-sm text-medium">{text}</span>
			</span>
		);
	}

	if (state === "stale") {
		return (
			<span className="flex items-center justify-start gap-1">
				<IonIcon icon={alertCircleOutline} color="warning" />
				<span className="text-sm text-[var(--ion-color-warning)]">{text}</span>
			</span>
		);
	}


	return (
		<span className="flex items-center justify-start gap-1">
			<IonIcon icon={checkmarkCircleOutline} color="success" />
			<span className="text-sm text-[var(--ion-color-success)]">{text}</span>
		</span>
	);
};
