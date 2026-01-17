import { useAlert } from "../contexts/useAlert";
import { useEventCallback } from "./useEventCallbck/useEventCallback";

interface Props {
	header: string;
	message: string;
	confirmText: string;
	danger: boolean;
}

export const useConfirmDialog = ({ header, message, confirmText, danger = false }: Props) => {
	const { showAlert } = useAlert();


	const showConfirmdialog = useEventCallback(() => {
		return showAlert({
			header,
			message,
			backdropDismiss: false,
			buttons: [
				{
					text: "Cancel",
					role: "cancel",
					cssClass: "alert-button-cancel"
				},
				{
					text: confirmText,
					role: "confirm",
					cssClass: danger ? "alert-button-confirm-danger" : "alert-button-confirm"

				}
			]
		});
	})

	return showConfirmdialog;

}
