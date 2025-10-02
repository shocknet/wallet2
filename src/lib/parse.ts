
import { createNofferInvoice, decodeNoffer } from "./noffer";
import { InputClassification, ParsedInput, ParsedInvoiceInput, ParsedNofferInput } from "./types/parse";
import { requestLnurlServiceParams } from "./lnurl/get";
import { validateAddress } from "./address";
import { decodeInvoice } from "./invoice";
import type { NostrKeyPair } from "@/Api/nostrHandler";
import type { Satoshi } from "./types/units";
import { parseUserInputToSats } from "./units";
import { nip19, OfferPriceType } from "@shocknet/clink-sdk";
import { LN_INVOICE_REGEX, LNURL_REGEX, BITCOIN_ADDRESS_REGEX, LN_ADDRESS_REGEX, NOFFER_REGEX, NPROFILE_REGEX } from "./regex";
import { utils } from "nostr-tools";



const removePrefixIfExists = (str: string, prefix: string) => str.startsWith(prefix) ? str.slice(prefix.length) : str;

type InputClassificationConfig =
	| { allowed: InputClassification[]; disallowed?: never }
	| { disallowed: InputClassification[]; allowed?: never }
	| undefined;

type Validator = {
	type: InputClassification;
	test: (s: string) => boolean;
};

const VALIDATORS: Validator[] = [
	{ type: InputClassification.LN_INVOICE, test: (s) => LN_INVOICE_REGEX.test(s) },
	{ type: InputClassification.LNURL_PAY, test: (s) => LNURL_REGEX.test(s) },
	{ type: InputClassification.BITCOIN_ADDRESS, test: (s) => BITCOIN_ADDRESS_REGEX.test(s) },
	{ type: InputClassification.LN_ADDRESS, test: (s) => LN_ADDRESS_REGEX.test(s) },
	{ type: InputClassification.NOFFER, test: (s) => NOFFER_REGEX.test(s) },
	{ type: InputClassification.NPROFILE, test: (s) => NPROFILE_REGEX.test(s) },
];

// Function to identify input type through regex. Can disallow certain types of input using config.disallowed.
export function identifyBitcoinInput(incomingInput: string, config?: InputClassificationConfig): InputClassification {
	const input = incomingInput.trim();
	if (!input) return InputClassification.UNKNOWN;

	let validators = VALIDATORS;

	if (config?.allowed) {
		const allow = new Set(config.allowed);
		validators = validators.filter(v => allow.has(v.type));
	} else if (config?.disallowed) {
		const deny = new Set(config.disallowed);
		validators = validators.filter(v => !deny.has(v.type));
	}



	const filteredValidators = validators.filter(validator => {
		if (config?.disallowed) return !config.disallowed.includes(validator.type);
		return true;
	})

	for (const validator of filteredValidators) {
		if (validator.test(input)) {
			return validator.type
		}
	}

	return InputClassification.UNKNOWN;
}

export const parseInvoiceInput = (input: string, expectedAmount?: Satoshi): ParsedInvoiceInput => {
	const invoice = removePrefixIfExists(input, "lightning:");
	const { amount, description } = decodeInvoice(invoice, expectedAmount);

	return {
		type: InputClassification.LN_INVOICE,
		data: invoice,
		amount,
		memo: description
	};
}
// Takes input string and its previously determined InputClassification and returns a ParsedInput object.
export async function parseBitcoinInput(incomingInput: string, matchedClassification: InputClassification, keyPair?: NostrKeyPair): Promise<ParsedInput> {
	const input = incomingInput.trim();

	switch (matchedClassification) {
		case InputClassification.LN_INVOICE: {
			return parseInvoiceInput(input);
		}
		case InputClassification.LNURL_PAY: {
			const lnurl = removePrefixIfExists(input, "lightning:");
			const lnurlResponse = await requestLnurlServiceParams(lnurl);
			if (lnurlResponse.tag === "withdrawRequest") {
				return {
					type: InputClassification.LNURL_WITHDRAW,
					data: lnurl,
					...lnurlResponse
				}
			} else {
				return {
					type: InputClassification.LNURL_PAY,
					data: lnurl,
					...lnurlResponse
				}
			}
		}
		case InputClassification.BITCOIN_ADDRESS: {
			const address = removePrefixIfExists(input, "bitcoin:");
			validateAddress(address); // throws

			return {
				type: InputClassification.BITCOIN_ADDRESS,
				data: address
			};
		}
		case InputClassification.LN_ADDRESS: {
			const address = removePrefixIfExists(input, "lightning:");
			const lnurlResponse = await requestLnurlServiceParams(address, true);
			if (lnurlResponse.tag !== "payRequest") {
				throw new Error("Invalid response from Lightning Address service");
			}
			return {
				type: InputClassification.LN_ADDRESS,
				data: address,
				...lnurlResponse
			}
		}
		case InputClassification.NOFFER: {
			if (!keyPair) {
				throw new Error("Not a pub spend source");
			}
			const noffer = removePrefixIfExists(input, "lightning:");
			const decoded = decodeNoffer(noffer);
			const { price, priceType } = decoded;
			const base: ParsedNofferInput = {
				type: InputClassification.NOFFER,
				data: input,
				noffer: decoded,
				priceType: OfferPriceType.Spontaneous,
			}

			// Default to spontaneous if neither field exists
			if (price === undefined && priceType === undefined) {
				return base;
			}

			let parsedInvoice: ParsedInvoiceInput;
			switch (priceType) {
				case OfferPriceType.Fixed:
				case OfferPriceType.Variable: {
					// For Fixed and Variable, we want to get an invoice right away, so the user can see the amount before sending.
					const invoice = await createNofferInvoice(decoded, keyPair);
					if (typeof invoice !== "string") {
						throw new Error(invoice.error);
					}
					const classification = identifyBitcoinInput(invoice);
					if (classification !== InputClassification.LN_INVOICE) {
						throw new Error("Invalid invoice from noffer");
					}
					parsedInvoice = parseInvoiceInput(invoice, parseUserInputToSats((price || 0).toString(), "sats"));


					return {
						...base,
						priceType: priceType,
						invoiceData: parsedInvoice
					};
				}


				case OfferPriceType.Spontaneous:
					return base;
				default:
					throw new Error("Invalid price type");
			}
		}
		case InputClassification.NPROFILE: {

			const result = nip19.decode(input);
			if (result.type !== "nprofile") throw new Error("Not an nprofile string");

			return {
				type: InputClassification.NPROFILE,
				data: input,
				relays: (result.data.relays ?? []).map(utils.normalizeURL),
				pubkey: result.data.pubkey
			}
		}
		default:
			return { type: InputClassification.UNKNOWN, data: input };
	}
}
