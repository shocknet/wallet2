import { NostrKeyPair } from '@/Api/nostrHandler';
import { nip19, nip69 } from 'nostr-tools';
import { Satoshi } from './types/units';
import { sendNip69 } from '@/Api/nostr';
const { decode: decodeNip19 } = nip19;

export function decodeNoffer(data: string) {
	const decoded = decodeNip19(data);
	if (decoded.type !== "noffer") {
		throw new Error("Invalid noffer");
	}
	return decoded.data;
}


export async function createNofferInvoice(noffer: nip19.OfferPointer, keys: NostrKeyPair, amount?: Satoshi): Promise<string | nip69.Nip69Error> {
	const { offer } = noffer
	const res = await sendNip69(noffer, { offer, amount }, keys)
	const resErr = res as nip69.Nip69Error
	if (resErr.error) {
		// If the error is a 5 (range error), we want that error returned to use the reported range
		if (resErr.code === 5) {
			return resErr;
		}
		// If it's any other error, throw it
		throw new Error(resErr.error);
	}
	const bolt11 = (res as nip69.Nip69Success).bolt11
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
