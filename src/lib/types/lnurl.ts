import { nip19 } from "nostr-tools";
import { Satoshi } from "./units";

export interface LightningAddress {
	username: string
	domain: string
}
export interface LnurlPayServiceResponse {
	tag: "payRequest";
	callback: string;
	fixed: boolean;       // whether min === max
	min: Satoshi;         // in sats
	max: Satoshi;         // in sats
	domain?: string;
	metadata: Array<Array<string>>;
	identifier: string;
	description: string;
	image: string;
	commentAllowed: number;
	noffer?: nip19.OfferPointer;
}
export interface LnurlWithdrawServiceResponse {
	tag: "withdrawRequest";
	callback: string;
	k1: string;
	min: Satoshi;    // in sats
	max: Satoshi;    // in sats
	domain?: string;
	defaultDescription: string;
}
export type LnurlServiceResponse = LnurlPayServiceResponse | LnurlWithdrawServiceResponse;