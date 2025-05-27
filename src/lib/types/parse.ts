import { nip19 } from "nostr-tools";
import { LnurlPayServiceResponse, LnurlWithdrawServiceResponse } from "./lnurl";
import { Satoshi } from "./units";
import { OfferPriceType } from "nostr-tools/lib/types/nip19";


/* Standardized types for handling all "bitcoin things" input across shockwallet */
export enum InputClassification {
	BITCOIN_ADDRESS = "Bitcoin address",
	LN_INVOICE = "Lightning invoice",
	LNURL_PAY = "LNURL Pay",
	LNURL_WITHDRAW = "LNURL Withdraw",
	LN_ADDRESS = "Lightning address",
	UNKNOWN = "NO_IDEA",
	NOFFER = "Noffer"
}

interface ParsedInputBase {
	type: InputClassification;
	data: string;
}

export interface ParsedInvoiceInput extends ParsedInputBase {
	type: InputClassification.LN_INVOICE;
	amount: Satoshi;
	memo?: string;
}
export interface ParsedLnurlPayInput extends ParsedInputBase, LnurlPayServiceResponse {
	type: InputClassification.LNURL_PAY;
}
export interface ParsedLightningAddressInput extends ParsedInputBase, LnurlPayServiceResponse {
	type: InputClassification.LN_ADDRESS;
	noffer?: nip19.OfferPointer;
}
export interface ParsedLnurlWithdrawInput extends ParsedInputBase, LnurlWithdrawServiceResponse {
	type: InputClassification.LNURL_WITHDRAW;
}
export interface ParsedBitcoinAddressInput extends ParsedInputBase {
	type: InputClassification.BITCOIN_ADDRESS;
}
export type ParsedNofferInput = ParsedInputBase & {
	type: InputClassification.NOFFER;
	noffer: nip19.OfferPointer;
} & (
		| {
			priceType: OfferPriceType.Fixed;
			invoiceData: ParsedInvoiceInput;
		}
		| {
			priceType: OfferPriceType.Variable;
			invoiceData: ParsedInvoiceInput;
		}
		| {
			priceType: OfferPriceType.Spontaneous;
			invoiceData?: never;
		}
	)
export interface ParsedUnknownInput extends ParsedInputBase {
	type: InputClassification.UNKNOWN;
}

export type ParsedInput =
	| ParsedInvoiceInput
	| ParsedLnurlPayInput
	| ParsedLnurlWithdrawInput
	| ParsedBitcoinAddressInput
	| ParsedLightningAddressInput
	| ParsedNofferInput
	| ParsedUnknownInput;



