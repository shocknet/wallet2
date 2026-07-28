import { IonChip, IonIcon, IonLabel } from "@ionic/react";
import {
	cloudOutline,
	extensionPuzzleOutline,
	keyOutline,
} from "ionicons/icons";
import {
	Identity,
	IdentityType,
	identityTypeLabel,
} from "@/State/identitiesRegistry/types";

function identityTypeIcon(type: IdentityType): string {
	switch (type) {
		case IdentityType.SANCTUM:
			return cloudOutline;
		case IdentityType.NIP07:
			return extensionPuzzleOutline;
		case IdentityType.LOCAL_KEY:
			return keyOutline;
	}
}

export function IdentityTypeBadge({
	identity,
	className = "",
}: {
	identity: Pick<Identity, "type">;
	className?: string;
}) {
	return (
		<IonChip
			className={[
				"m-0 h-auto min-h-0 px-2.5 py-1 text-xs tracking-wide",
				"bg-[color-mix(in_srgb,var(--ion-color-primary)_12%,transparent)]",
				"text-[var(--ion-color-primary)]",
				className,
			].join(" ")}
		>
			<IonIcon
				icon={identityTypeIcon(identity.type)}
				color="primary"
				className="text-sm"
			/>
			<IonLabel className="text-xs text-[var(--ion-color-primary)]">
				{identityTypeLabel(identity)}
			</IonLabel>
		</IonChip>
	);
}
