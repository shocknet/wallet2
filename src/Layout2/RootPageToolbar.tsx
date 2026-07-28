import { IonButton, IonButtons, IonIcon, IonTitle, IonToolbar, useIonRouter } from "@ionic/react";
import { notificationsOutline } from "ionicons/icons";
import { ProfileMenuButton } from "./ProfileMenuButton";
import LogoButton from "./LogoButton";
import SourcesStatusIndicator from "@/Components/SourcesStatusIndicator";

interface RootPageToolbarProps {
	title?: string;
}
function RootPageToolbar({ title }: RootPageToolbarProps) {
	const router = useIonRouter();
	return (
		<IonToolbar>
			<IonButtons slot="start">
				<LogoButton onClick={() => router.push("/home", "root")} />
			</IonButtons>
			{
				title && (
					<IonTitle>
						{title}
					</IonTitle>
				)
			}
			<IonButtons slot="end">
				<SourcesStatusIndicator />
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

export default RootPageToolbar;
