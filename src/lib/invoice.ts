import { decode } from "@gandlaf21/bolt11-decode";
import { Satoshi } from "./types/units"
import { DecodedInvoice } from "./types/invoice";
import { isValidMSats, msatsToSats } from "./units";


export function decodeInvoice(invoice: string, expectedAmount?: Satoshi): DecodedInvoice {
	let network = undefined
	if (invoice.startsWith("lntbs")) {
		network = {
			bech32: 'tbs',
			pubKeyHash: 0x6f,
			scriptHash: 0xc4,
			validWitnessVersions: [0]
		}
	}
	const decodedInvoice = decode(invoice, network);
	const amountSection = decodedInvoice.sections.find(section => section.name === "amount");
	const description = decodedInvoice.sections.find(section => section.name === "description")?.value;

	if (!amountSection) {
		throw new Error("Error decoding provided invoice");
	}

	if (!isValidMSats(+amountSection.value)) {
		console.log("here?", amountSection)
		throw new Error("Error decoding provided invoice");
	}

	const sats = msatsToSats(amountSection.value, "round");

	if (expectedAmount !== undefined && sats !== expectedAmount) {
		throw new Error("Amount mismatch");
	}
	return { amount: sats, description };
}