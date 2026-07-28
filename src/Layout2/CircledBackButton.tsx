import { IonBackButton } from "@ionic/react";
import { chevronBackOutline } from "ionicons/icons";

export function CircledBackButton({
	defaultHref = "/home",
}: {
	defaultHref?: string;
}) {

	return (
		<IonBackButton
			defaultHref={defaultHref}
			icon={chevronBackOutline}
			className="
				[--background:var(--back-button-color)]
				[--icon-margin-bottom:0]
				[--icon-margin-top:0]
				[--icon-margin-end:0]
				[--icon-margin-start:0]
				[--icon-padding-bottom:0]
				[--icon-padding-top:0]
				[--icon-padding-start:0]
				[--icon-padding-end:2px]
				[--margin-bottom:0]
				[--margin-top:0]
				[--margin-end:0]
				[--margin-start:0]
				[--padding-bottom:0]
				[--padding-top:0]
				[--padding-start:0]
				[--padding-end:0]
			"
		>

		</IonBackButton>
	);
}
