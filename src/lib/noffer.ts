import { NostrKeyPair } from '@/Api/nostrHandler';
import { nip19, nip69 } from 'nostr-tools';
import { Satoshi } from './types/units';
import { sendNip69 } from '@/Api/nostr';
import { decodeInvoice } from './invoice';
const { decode: decodeNip19 } = nip19;

export function decodeNoffer(data: string) {
	const decoded = decodeNip19(data);
	if (decoded.type !== "noffer") {
		throw new Error("Invalid noffer");
	}
	return decoded.data;
}


export async function createNofferInvoice(noffer: nip19.OfferPointer, keys: NostrKeyPair, amount?: Satoshi) {
	const { offer } = noffer
	const res = await sendNip69(noffer, { offer, amount }, keys)
	const resErr = res as nip69.Nip69Error
	if (resErr.error) {
		if (resErr.code === 5) {
			throw new Error("value must be between " + resErr.range.min + " and " + resErr.range.max);
		}
		throw new Error(resErr.error);
	}
	const bolt11 = (res as nip69.Nip69Success).bolt11
	const invoice = decodeInvoice(bolt11)
	if (amount && invoice.amount !== amount) {
		throw new Error("Amount mismatch");
	}
	return bolt11;
}

export function priceTypeToString(priceType: nip19.OfferPriceType) {
	switch (priceType) {
		case nip19.OfferPriceType.Fixed:
			return "Fixed";
		case nip19.OfferPriceType.Variable:
			return "Variable";
		case nip19.OfferPriceType.Spontaneous:
			return "Spontaneous";
		default:
			throw new Error("Unknown price type");
	}
}