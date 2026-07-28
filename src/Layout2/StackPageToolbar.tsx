import { IonButton, IonButtons, IonIcon, IonTitle, IonToolbar } from "@ionic/react";
import { CircledBackButton } from "./CircledBackButton";
import { notificationsOutline } from "ionicons/icons";
import { ProfileMenuButton } from "./ProfileMenuButton";

interface StackPageToolbarProps {
	title?: string;
}
function StackPageToolbar({ title }: StackPageToolbarProps) {
	return (
		<IonToolbar>
			<IonButtons slot="start">
				<CircledBackButton />
			</IonButtons>
			{
				title && (
					<IonTitle>
						{title}
					</IonTitle>
				)
			}
			<IonButtons slot="end">
				<IonButton
					className="text-muted"
				>
					<IonIcon slot="icon-only" icon={notificationsOutline} />
				</IonButton>
				<ProfileMenuButton />
			</IonButtons>
		</IonToolbar>
	)
}

export default StackPageToolbar;
