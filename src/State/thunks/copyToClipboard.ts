import { checkmarkCircle } from "ionicons/icons";
import { addAsset } from "../Slices/generatedAssets";
import { AppDispatch } from "../store";
import { ShowToast } from "@/lib/contexts/useToast";
import { Clipboard } from "@capacitor/clipboard";

export const copyToClipboard = (text: string, showToast: ShowToast, save?: true) => async (dispatch: AppDispatch) => {
	try {
		await Clipboard.write({ string: text });
	} catch (err) {
		console.error("Error copying to clipboard", err);
		showToast({
			message: "Error copying to clipboard",
			duration: 1500,
			position: "bottom",
			color: "danger",
		});
		return;
	}

	showToast({
		message: "Copied to clipboard",
		duration: 1500,
		position: "bottom",
		color: "success",
		icon: checkmarkCircle,
	})

	if (save) {
		dispatch(addAsset({ asset: text }));
	}
}
