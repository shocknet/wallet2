import { useState, useSyncExternalStore } from "react";
import { IonToast } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { applyUpdate, isUpdateReady, subscribeUpdateReady } from "@/swUpdate";

export function UpdateToast() {
	const ready = useSyncExternalStore(subscribeUpdateReady, isUpdateReady);
	const [dismissed, setDismissed] = useState(false);

	return (
		<IonToast
			isOpen={ready && !dismissed}
			message="New version ready"
			position="bottom"
			onDidDismiss={() => setDismissed(true)}
			buttons={[
				{ text: "Refresh", handler: applyUpdate },
				{ icon: closeOutline, role: "cancel" },
			]}
		/>
	);
}
