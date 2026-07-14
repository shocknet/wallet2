import { IonButtons, IonToolbar } from "@ionic/react";

import { CircledBackButton } from "./CircledBackButton";

export function StackPageToolbar() {
	return (
		<IonToolbar>
			<IonButtons slot="start">
				<CircledBackButton />
			</IonButtons>
		</IonToolbar>
	)
}
