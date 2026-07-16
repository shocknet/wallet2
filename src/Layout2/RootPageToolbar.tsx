import { IonButtons, IonToolbar } from "@ionic/react"
import { CircledBackButton } from "./CircledBackButton"
import { ProfileMenuButton } from "./ProfileMenuButton"

export function RootPageToolbar() {
	return (
		<IonToolbar>
			<IonButtons slot="start">
				<CircledBackButton />
			</IonButtons>
			<IonButtons slot="end">
				<ProfileMenuButton />
			</IonButtons>
		</IonToolbar>
	)
}
