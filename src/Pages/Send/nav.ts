import type { History } from "history";
import { InputClassification } from "@/lib/types/parse";
import type {
	ParsedInput,
	ParsedInvoiceInput,
	ParsedLightningAddressInput,
	ParsedLnurlPayInput,
	ParsedNofferInput,
} from "@/lib/types/parse";

export type SendParsedInput =
	| ParsedInvoiceInput
	| ParsedLnurlPayInput
	| ParsedLightningAddressInput
	| ParsedNofferInput;

export type SendPageNavState = {
	parsed: SendParsedInput;
};

export function isSendParsedInput(
	parsed: ParsedInput,
): parsed is SendParsedInput {
	switch (parsed.type) {
		case InputClassification.LN_INVOICE:
		case InputClassification.LNURL_PAY:
		case InputClassification.LN_ADDRESS:
		case InputClassification.NOFFER:
			return true;
		default:
			return false;
	}
}

export function navToSend(history: History, state?: SendPageNavState) {
	history.push({ pathname: "/send", state });
}
