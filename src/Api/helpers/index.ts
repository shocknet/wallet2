import axios from "axios";
import { getNostrClient } from "..";
import { Destination, decodeLnurl } from "../../constants";


/* This file includes all possible transactional operations.
	I found myself wanting to do the same operations in different pages,
	like creating a nostr invoice for the sweep in send page, and the sweep itself in sources page
	so it's better to have them importable from one place.

	Error handling is done by throwing errors
*/

export const createNostrInvoice = async (pasteField: string, amount: number, memo?: string) => {	
	const res = await (await getNostrClient(pasteField)).NewInvoice({
		amountSats: +amount,
		memo: memo || ""
	})

	if (res.status !== 'OK') {
		throw new Error(res.reason);
	}
	return res.invoice;
}

export const createNostrPayLink = async (pasteField: string) => {
	const res = await (await getNostrClient(pasteField)).GetLnurlPayLink()

	if (res.status !== 'OK') {
		throw new Error(res.reason);
	}
	return res.lnurl;
}

// both lnurl and ln address
export const createLnurlInvoice = async (amountToPay: number, dest: Destination) => {
	if (amountToPay === 0) {
		throw new Error("No amount set");
	}
	const { callback, min, max } = dest as { callback: string, min: number, max: number };
	if (amountToPay < min || amountToPay > max) {
		throw new Error(`Can only send between ${min} and ${max} sats.`);
	}
	const resp = await axios.get(
		callback + (callback.includes('?') ? "&" : "?") + "amount=" + amountToPay * 1000,
		{
			headers: {
				'Content-Type': 'application/json',
				withCredentials: false,
			}
		}
	);

	if (resp.data.status === "ERROR") {
		throw new Error(resp.data.reason);
	}
	return resp.data.pr
};


export const handlePayInvoice = async (invoice: string, sourcePasteField: string) => {
	if (sourcePasteField.includes("nprofile")) {
		const payRes = await (await getNostrClient(sourcePasteField)).PayInvoice({
			invoice: invoice,
			amount: 0,
		})
		if (payRes.status == "OK") {
			return { ...payRes, data: invoice };
		} else {
			throw new Error(payRes.reason);
		}
	} else {
		// lnurl-withdraw source
		const lnurlEndpoint = decodeLnurl(sourcePasteField);
		const res = await axios.get(lnurlEndpoint);
		const { k1, callback } = res.data as { k1: string, callback: string };
		const resp = await axios.get(
			callback + (callback.includes('?') ? "&" : "?") + "k1=" + k1 + "&" + "pr=" + invoice,
			{
				headers: {
					'Content-Type': 'application/json',
					withCredentials: false,
				}
			}
		);

		if (resp.data.status === "ERROR") {
			throw new Error(res.data.reason);
		}
		
		return { operation_id: `lnurl-withdraw-${Date.now()}`, service_fee: 0, network_fee: 0, data: invoice }
	}
};

export const handlePayBitcoinAddress = async (sourcePasteField: string, address: string, amount: number, satsPerVByte: number) => {
	if (!sourcePasteField.includes("nprofile")) throw new Error("Source is not nprofile");

	const payRes = await (await getNostrClient(sourcePasteField)).PayAddress({
		address,
		amoutSats: +amount,
		satsPerVByte
	})
	
	if (payRes.status == "OK") {
		return { ...payRes, data: address  };
	} else {
		throw new Error(payRes.reason);
	}
};




