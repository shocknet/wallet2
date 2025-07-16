
import { createNofferInvoice, decodeNoffer } from "./noffer";
import { InputClassification, ParsedInput, ParsedInvoiceInput, ParsedNofferInput } from "./types/parse";
import { requestLnurlServiceParams } from "./lnurl/get";
import { validateAddress } from "./address";
import { decodeInvoice } from "./invoice";
import { NostrKeyPair } from "@/Api/nostrHandler";
import { Satoshi } from "./types/units";
import { parseUserInputToSats } from "./units";
import { OfferPriceType } from "@shocknet/clink-sdk";


const BITCOIN_ADDRESS_REGEX = /^(bitcoin:)?(bc1[qp][ac-hj-np-z02-9]{8,87}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/;
export const BITCOIN_ADDRESS_BASE58_REGEX = /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/;
const LN_INVOICE_REGEX = /^(lightning:)?(lnbc|lntb)[0-9a-zA-Z]+$/;
const LNURL_REGEX = /^(lightning:)?[Ll][Nn][Uu][Rr][Ll][0-9a-zA-Z]+$/;
const NOFFER_REGEX = /^(lightning:)?[Nn][Oo][Ff][Ff][Ee][Rr][0-9a-zA-Z]+$/;
const LN_ADDRESS_REGEX = /^(lightning:)?[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;

const removePrefixIfExists = (str: string, prefix: string) => str.startsWith(prefix) ? str.slice(prefix.length) : str;

interface InputClassificationConfig {
	disallowed?: InputClassification[];
}

// Function to identify input type through regex. Can disallow certain types of input using config.disallowed.
export function identifyBitcoinInput(incomingInput: string, config?: InputClassificationConfig): InputClassification {
	const input = incomingInput.trim();
	let matchedType: InputClassification = InputClassification.UNKNOWN;

	const validators: {
		type: InputClassification;
		test: (input: string) => boolean;
	}[] = [
			{ type: InputClassification.LN_INVOICE, test: (input: string) => LN_INVOICE_REGEX.test(input) },
			{ type: InputClassification.LNURL_PAY, test: (input: string) => LNURL_REGEX.test(input) },
			{ type: InputClassification.BITCOIN_ADDRESS, test: (input: string) => BITCOIN_ADDRESS_REGEX.test(input) },
			{ type: InputClassification.LN_ADDRESS, test: (input: string) => LN_ADDRESS_REGEX.test(input) },
			{ type: InputClassification.NOFFER, test: (input: string) => NOFFER_REGEX.test(input) }
		];

	const filteredValidators = validators.filter(validator => {
		if (config?.disallowed) return !config.disallowed.includes(validator.type);
		return true;
	})

	for (const validator of filteredValidators) {
		if (validator.test(input)) {
			matchedType = validator.type;
			break;
		}
	}

	return matchedType;
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
		default:
			return { type: InputClassification.UNKNOWN, data: input };
	}
}
