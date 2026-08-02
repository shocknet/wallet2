import { IonBackButton } from "@ionic/react";
import { chevronBackOutline } from "ionicons/icons";


const SIZE_PX = 40;

export function CircledBackButton({
	defaultHref = "/home",
}: {
	defaultHref?: string;
}) {
	return (
		<IonBackButton
			defaultHref={defaultHref}
			icon={chevronBackOutline}
			text=""
			style={{
				width: SIZE_PX,
				height: SIZE_PX,
				minWidth: SIZE_PX,
				minHeight: SIZE_PX,
			}}
			className="
				[--background:var(--back-button-color)]
				[--padding-start:0]
				[--padding-end:0]
				[--padding-top:0]
				[--padding-bottom:0]
				[--icon-margin-start:0]
				[--icon-margin-end:0]
				[--icon-font-size:1.125rem]
			"
		/>
	);
}
