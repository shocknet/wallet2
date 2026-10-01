import { selectAllLiveSourcesDown } from "@/State/scoped/backups/sources/selectors"
import { useAppSelector } from "@/State/store/hooks"
import { IonBadge, IonContent, IonIcon, IonPopover } from "@ionic/react";
import { alertOutline } from "ionicons/icons";

const SourcesStatusIndicator = () => {
	const allDown = useAppSelector(selectAllLiveSourcesDown);

	if (!allDown) return null;

	return (
		<>
			<IonBadge id="sources-down-trigger" color="danger" className="rounded-full">
				<IonIcon icon={alertOutline} />
			</IonBadge>

			<IonPopover side="left" alignment="start" trigger="sources-down-trigger" triggerAction="click">
				<IonContent class="ion-padding">All sources down</IonContent>
			</IonPopover>
		</>
	)
}

export default SourcesStatusIndicator;
