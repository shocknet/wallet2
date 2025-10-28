import { useAlert } from "../contexts/useAlert";
import { useEventCallback } from "./useEventCallbck/useEventCallback";

interface Props {
	header: string;
	message: string;
	confirmText: string;
}

export const useConfirmDialog = ({ header, message, confirmText }: Props) => {
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

				},
				{
					text: confirmText,
					role: "confirm",
					cssClass: "text-red-500"

				}
			]
		});
	})

	return showConfirmdialog;

}
