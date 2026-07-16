import { PasswordCreationModal } from "@/Components/Modals/PasswordCreationModal";
import { useIonModal } from "@ionic/react";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { useCallback } from "react";

export function useAskCreatePassword(
	username?: string,
	description?: string,
	cancelButtonLabel?: string,
) {
	const [present, dismiss] = useIonModal(PasswordCreationModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		username,
		description,
		cancelButtonLabel,
	});

	const askCreatePassword = useCallback(() => {
		return new Promise<string | undefined>((resolve) => {
			present({
				cssClass: "wallet-modal dialog-modal",
				onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
					if (event.detail.role === "confirm") {
						resolve(event.detail.data as string);
					} else {
						resolve(undefined);
					}
				},
			});
		});
	}, [present]);

	return askCreatePassword;
}
