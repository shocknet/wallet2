import { PasswordInputModal } from "@/Components/Modals/PasswordInputModal";
import { useIonModal } from "@ionic/react";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { useCallback } from "react";


export function useAskPassword(username?: string, description?: string) {
	const [present, dismiss] = useIonModal(PasswordInputModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		username,
		description
	});

	const askPassword = useCallback(() => {
		return new Promise<string | undefined>((resolve) => {
			present({
				cssClass: "wallet-modal dialog-modal",
				onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
					if (event.detail.role === 'confirm') {
						resolve(event.detail.data as string);
					} else {
						resolve(undefined);
					}
				},
			});
		});
	}, [present]);

	return askPassword;
}
