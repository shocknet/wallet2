
import { createNofferInvoice, decodeNoffer } from "./noffer";
import { InputClassification, ParsedInput, ParsedInvoiceInput, ParsedNofferInput } from "./types/parse";
import { requestLnurlServiceParams } from "./lnurl/get";
import { validateAddress } from "./address";
import { decodeInvoice } from "./invoice";
import type { NostrKeyPair } from "@/Api/nostrHandler";
import type { Satoshi } from "./types/units";
import { parseUserInputToSats } from "./units";
import { nip19, OfferPriceType } from "@shocknet/clink-sdk";
import {
	LN_INVOICE_REGEX,
	LNURL_REGEX,
	BITCOIN_ADDRESS_REGEX,
	NOFFER_REGEX,
	BITCOIN_ADDRESS_BASE58_REGEX,
	NPROFILE_WITH_TOKEN_REGEX,
	RelayUrlSchema,
	LN_ADDRESS_REGEX
} from "./regex";



type InputClassificationConfig =
	| { allowed: InputClassification[]; disallowed?: never }
	| { disallowed: InputClassification[]; allowed?: never }
	| undefined;

interface IdentifyResult {
	classification: InputClassification;
	value: string
}

const matchBech32 = (re: RegExp, s: string, classification: InputClassification): IdentifyResult | null => {
	const m = s.match(re);
	if (m) {
		return {
			classification,
			value: m[1].toLowerCase()
		}
	} else {
		return null
	}

};



type Validator = {
	type: InputClassification;
	test: (s: string) => IdentifyResult | null;
};



const VALIDATORS: Validator[] = [
	{ type: InputClassification.LN_INVOICE, test: (s) => matchBech32(LN_INVOICE_REGEX, s, InputClassification.LN_INVOICE) },
	{ type: InputClassification.LNURL_PAY, test: (s) => matchBech32(LNURL_REGEX, s, InputClassification.LNURL_PAY) },
	{
		type: InputClassification.BITCOIN_ADDRESS, test: (s) => {

			// Attempt segwit
			const seg = matchBech32(BITCOIN_ADDRESS_REGEX, s, InputClassification.BITCOIN_ADDRESS);
			if (seg) return seg;

			// Then attempt base58
			const m58 = s.match(BITCOIN_ADDRESS_BASE58_REGEX);
			if (m58) return { classification: InputClassification.BITCOIN_ADDRESS, value: m58[1] };

			return null;
		}
	},
	{
		type: InputClassification.LN_ADDRESS, test: (s) => matchBech32(LN_ADDRESS_REGEX, s, InputClassification.LN_ADDRESS),
	},
	{ type: InputClassification.NOFFER, test: (s) => matchBech32(NOFFER_REGEX, s, InputClassification.NOFFER) },
	{
		type: InputClassification.NPROFILE, test: (s) => {
			const m = s.match(NPROFILE_WITH_TOKEN_REGEX);
			if (m) {
				const nprofileLower = m[1].toLowerCase();
				const adminToken = m[2];
				return adminToken
					? { classification: InputClassification.NPROFILE, value: nprofileLower + ":" + adminToken }
					: { classification: InputClassification.NPROFILE, value: nprofileLower };
			} else {
				return null
			}
		}
	},
];

// Function to identify input type through regex. Can disallow certain types of input using config.disallowed.
export function identifyBitcoinInput(incomingInput: string, config?: InputClassificationConfig): IdentifyResult {

	const empty = { classification: InputClassification.UNKNOWN, value: "" };
	const input = incomingInput.trim();
	if (!input) return empty;

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
		const res = validator.test(input);
		if (res) {
			return res
		}

	}

	return empty;
}


export const parseInvoiceInput = (invoice: string, expectedAmount?: Satoshi): ParsedInvoiceInput => {

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
			const lnurl = input;
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
			const address = input
			validateAddress(address); // throws

			return {
				type: InputClassification.BITCOIN_ADDRESS,
				data: address
			};
		}
		case InputClassification.LN_ADDRESS: {
			const address = input
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
			const noffer = input
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
					const { classification, value } = identifyBitcoinInput(invoice);
					if (classification !== InputClassification.LN_INVOICE) {
						throw new Error("Invalid invoice from noffer");
					}
					parsedInvoice = parseInvoiceInput(value, parseUserInputToSats((price || 0).toString(), "sats"));


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
			const splitted = input.split(":");
			const nprofile = splitted[0];
			const adminEnrollToken = splitted.length > 1 ? splitted[1] : undefined;
			const result = nip19.decode(nprofile);
			if (result.type !== "nprofile") throw new Error("Not an nprofile string");
			if (!result.data.relays) throw new Error("No relays");

			const parseResults = result.data.relays.map(r => RelayUrlSchema.safeParse(r));
			const relays = parseResults.filter(res => res.success).map(res => res.data!);

			if (relays.length === 0) {
				throw new Error("Invalid or no relay URLs");
			}




			return {
				type: InputClassification.NPROFILE,
				data: nprofile,
				relays: relays,
				pubkey: result.data.pubkey,
				adminEnrollToken
			}
		}
		default:
			return { type: InputClassification.UNKNOWN, data: input };
	}
}
