import { createNofferInvoice } from "@/lib/noffer";
import { getInvoiceFromLnurlPay } from "@/lib/lnurl/pay";
import type { NostrKeyPair } from "@/Api/nostrHandler";
import { InputClassification, type ParsedInput, type ParsedInvoiceInput } from "@/lib/types/parse";
import type { Satoshi } from "@/lib/types/units";
import { OfferPriceType } from "@shocknet/clink-sdk";

/** Turn a parsed recipient + amount into a bolt11. Throws NofferRangeError for code 5. */
export async function resolveRecipientToInvoice({
	parsed,
	amount,
	keys,
}: {
	parsed: ParsedInput;
	amount: Satoshi;
	keys: NostrKeyPair;
}): Promise<ParsedInvoiceInput> {
	switch (parsed.type) {
		case InputClassification.LN_INVOICE:
			return parsed;

		case InputClassification.LN_ADDRESS:
		case InputClassification.LNURL_PAY:
			if (parsed.noffer) {
				return createNofferInvoice(parsed.noffer, keys, amount);
			}
			return getInvoiceFromLnurlPay({
				lnUrlOrAddress: parsed.data,
				amountSats: amount,
				passedParams: parsed,
			});

		case InputClassification.NOFFER:
			return createNofferInvoice(
				parsed.noffer,
				keys,
				parsed.noffer.priceType === OfferPriceType.Spontaneous
					? amount
					: undefined,
			);

		default:
			throw new Error(`Cannot send to ${parsed.type}`);
	}
}
