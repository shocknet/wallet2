import { flash, globe, helpCircle, logoBitcoin, person } from "ionicons/icons";
import { InputClassification } from "./types/parse";

export function getIconFromClassification(classification: InputClassification): { icon: string; color?: string, style?: { [key: string]: string } } {
	switch (classification) {
		case InputClassification.LN_INVOICE:
			return { icon: flash, color: "primary" };
		case InputClassification.LNURL_PAY:
			return { icon: globe, color: "tertiary" };
		case InputClassification.BITCOIN_ADDRESS:
			return { icon: logoBitcoin, style: { color: "orange" } };
		case InputClassification.LN_ADDRESS:
			return { icon: person, color: "orange" };
		default:
			return { icon: helpCircle, color: "medium" };
	}
}