import { useEffect, useState, useSyncExternalStore } from "react";
import { closeOutline } from "ionicons/icons";
import { useToast } from "@/lib/contexts/useToast";
import { applyUpdate, isUpdateReady, subscribeUpdateReady } from "@/swUpdate";

export function useUpdateToast() {
	const ready = useSyncExternalStore(subscribeUpdateReady, isUpdateReady);
	const [dismissed, setDismissed] = useState(false);
	const { showToast } = useToast();

	useEffect(() => {
		if (!ready || dismissed) return;
		showToast({
			message: "New version ready",
			color: "dark",
			position: "bottom",
			duration: 0,
			buttons: [
				{ text: "Refresh", handler: applyUpdate },
				{ icon: closeOutline, role: "cancel" },
			],
			onDidDismiss: () => setDismissed(true),
		});
	}, [ready, dismissed, showToast]);
}
