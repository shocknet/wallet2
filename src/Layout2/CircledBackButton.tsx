import { IonButton, IonIcon, useIonRouter } from "@ionic/react";
import { chevronBackOutline } from "ionicons/icons";

export function CircledBackButton({
	defaultHref = "/home",
}: {
	defaultHref?: string;
}) {
	const router = useIonRouter();

	return (
		<IonButton
			fill="solid"
			shape="round"
			className="
				m-0 h-11 w-11
				[--padding-start:0] [--padding-end:0]
				[--padding-top:0] [--padding-bottom:0]
				[--background:var(--app-surface-elevated)]

			"
			aria-label="Go back"
			onClick={() => {
				if (router.canGoBack()) {
					router.goBack();
					return;
				}
				router.push(defaultHref, "root", "replace");
			}}
		>

			<IonIcon
				icon={chevronBackOutline}
				className="text-xl [--color:var(--app-text-primary)]"
			/>

		</IonButton>
	);
}
