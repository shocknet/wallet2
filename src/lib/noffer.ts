import { NostrKeyPair } from '@/Api/nostrHandler';
import { decodeBech32, NofferError, NofferSuccess, OfferPointer, OfferPriceType } from '@shocknet/clink-sdk';
import { Satoshi } from './types/units';
import { sendNip69 } from '@/Api/nostr';
import { decodeInvoice } from './invoice';


export function decodeNoffer(data: string) {
	const decoded = decodeBech32(data);
	if (decoded.type !== "noffer") {
		throw new Error("Invalid noffer");
	}
	return decoded.data;
}


export async function createNofferInvoice(noffer: OfferPointer, keys: NostrKeyPair, amount?: Satoshi) {
	const { offer } = noffer
	const res = await sendNip69(noffer, { offer, amount }, keys)
	const resErr = res as NofferError
	if (resErr.error) {
		if (resErr.code === 5) {
			throw new Error("value must be between " + resErr.range.min + " and " + resErr.range.max);
		}
		throw new Error(resErr.error);
	}
	const bolt11 = (res as NofferSuccess).bolt11
	const invoice = decodeInvoice(bolt11)
	if (amount && invoice.amount !== amount) {
		throw new Error("Amount mismatch");
	}
	return bolt11;
}

export function priceTypeToString(priceType: OfferPriceType) {
	switch (priceType) {
		case OfferPriceType.Fixed:
			return "Fixed";
		case OfferPriceType.Variable:
			return "Variable";
		case OfferPriceType.Spontaneous:
			return "Spontaneous";
		default:
			throw new Error("Unknown price type");
	}
}