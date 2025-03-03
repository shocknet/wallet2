import { Clipboard } from "@capacitor/clipboard";
import { addAsset } from "../Slices/generatedAssets";
import { AppDispatch } from "../store";
import { toast } from "react-toastify";

export const copyToClipboard = (text: string, save?: true) => async (dispatch: AppDispatch) => {
	await Clipboard.write({ string: text });
	toast.success("Copied to clipboard");
	if (save) {
		dispatch(addAsset({ asset: text }));
	}
}