
import { bech32 } from 'bech32';
import axios from "axios";
import { validate } from 'bitcoin-address-validation';
import { decode } from "@gandlaf21/bolt11-decode";
import { notification } from "antd";
import { NotificationPlacement } from "antd/es/notification/interface";


export const locationRegex = new RegExp(/\w{1,}/g)

export const keylinkUrl = "https://test-auth.shock.network"
export const keylinkAppId = ""

export const HTTP_ADMIN_TOKEN_STORAGE_KEY = "HTTP_ADMIN_TOKEN"
export const HTTP_AUTH_TOKEN_STORAGE_KEY = "HTTP_AUTH_TOKEN"
export const NOSTR_PRIVATE_KEY_STORAGE_KEY = "NOSTR_PRIVATE_KEY"
export const NIP46_PRIVATE_KEY_STORAGE_KEY = "NIP46_PRIVATE_KEY"
export const NOSTR_PUBLIC_KEY_STORAGE_KEY = "NOSTR_PUBLIC_KEY"
export const PUB_NOSTR_PUBLIC_KEY_STORAGE_KEY = "PUB_NOSTR_PUBLIC_KEY";
export const NOSTR_RELAYS = ["wss://strfry.shock.network"]
export const NOSTR_PUB_DESTINATION = "e306c45ee0a7c772540f1dc88b00f79d2d3910bfd4047e910584998de9c9e2be";
export const usdToBTCSpotLink = "https://api.coinbase.com/v2/prices/BTC-USD/spot";
export const defaultMempool = "https://mempool.space/api/v1/fees/recommended";
export const options: any = {
	little: "A little.",
	very: "Very well.",
	mine: "It's my node.",
}

function padZero(number: number) {
	return number.toString().padStart(2, '0');
}

export function getFormattedTime(timestamp: number) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();

	// Format the time as desired (e.g., HH:MM:SS)
	const formattedTime = `${day}/${padZero(month)}/${padZero(year)} ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;

	return formattedTime;
}


const BITCOIN_ADDRESS_REGEX = /^(bitcoin:)?([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{39,59})$/;
const LN_INVOICE_REGEX = /^(lightning:)?(lnbc|lntb)[0-9a-zA-Z]+$/;
const LNURL_REGEX = /^(lightning:)?[Ll][Nn][Uu][Rr][Ll][0-9a-zA-Z]+$/;
const LN_ADDRESS_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;


export enum InputClassification {
	BITCOIN_ADDRESS = "BTC",
	LN_INVOICE = "INVOICE",
	LNURL = "LNURL",
	LN_ADDRESS = "LIGHTING_ADDRESS",
	UNKNOWN = "NO_IDEA"
}

export interface Destination {
	type: InputClassification,
	data: string,
	callback?: string,
	min?: number,
	max?: number,
	amount?: number,
	lnurlType?: "payRequest" | "withdrawRequest",
	lnurlEndpoint?: string,
	domainName?: string,
	hostName?: string,
	isPub?: boolean,
	memo?: string
}

export const decodeLnurl = (lnurl: string) => {
	const { words } = bech32.decode(lnurl, 2000);
	const sourceURL = bech32.fromWords(words);
	const buffer = new Uint8Array(sourceURL);
	const lnurlEndpoint = new TextDecoder().decode(buffer);
	return lnurlEndpoint;
}

export const parseBitcoinInput = async (input: string): Promise<Destination> => {
	const removePrefixIfExists = (str: string, prefix: string) => str.startsWith(prefix) ? str.slice(prefix.length) : str;

	if (LN_INVOICE_REGEX.test(input)) {
		const invoice = removePrefixIfExists(input, "lightning:");

		const decodedInvoice = decode(invoice);
		const amountSection = decodedInvoice.sections.find(section => section.name === "amount");
		const description = decodedInvoice.sections.find(section => section.name === "description")?.value;
		let amount = 0;
		if (amountSection) {
			amount = amountSection.value / 1000;
		} else {
			throw new Error("Error decoding provided invoice");
		}
		return {
			type: InputClassification.LN_INVOICE,
			data: invoice,
			amount,
			memo: description || undefined
		};
	} else if (LNURL_REGEX.test(input)) {
		const lnurl = removePrefixIfExists(input, "lightning:");

		const lnurlEndpoint = decodeLnurl(lnurl);

		const res = await axios.get(lnurlEndpoint);
		const lnurlType = res.data.tag;
		const hostName = new URL(lnurlEndpoint);
		const parts = hostName.hostname.split(".");
		const domainName = parts.slice(-2).join('.');
		return {
			type: InputClassification.LNURL,
			data: lnurl,
			callback: res.data.callback,
			min: lnurlType === "payRequest" ? Math.floor(res.data.minSendable / 1000) : Math.floor(res.data.minWithdrawable / 1000),
			max: lnurlType === "payRequest" ? Math.floor(res.data.maxSendable / 1000) : Math.floor(res.data.maxWithdrawable / 1000),
			lnurlType,
			lnurlEndpoint,
			domainName,
			hostName: hostName.hostname,
			isPub: domainName === "lightning.pub"
		};
	} else if (BITCOIN_ADDRESS_REGEX.test(input)) {
		const btcAddress = removePrefixIfExists(input, "bitcoin:");
		const isValidAddress = validate(btcAddress);
		if (!isValidAddress) {
			throw new Error("Invalid bitcoin address provided");
		}
		return {
			type: InputClassification.BITCOIN_ADDRESS,
			data: btcAddress
		};
	} else if (LN_ADDRESS_REGEX.test(input)) {
		const lnParts = input.split("@");

		const payLink = "https://" + lnParts[1] + "/.well-known/lnurlp/" + lnParts[0];

		const res = await axios.get(payLink);
		return {
			type: InputClassification.LN_ADDRESS,
			data: input,
			callback: res.data.callback,
			min: Math.floor(res.data.minSendable / 1000),
			max: Math.floor(res.data.maxSendable / 1000),
			domainName: lnParts[1],
			isPub: lnParts[1] === "lightning.pub"

		};
	} else {
		return { type: InputClassification.UNKNOWN, data: input };
	}
}





export const openNotification = (placement: NotificationPlacement, header: string, text: string, onClick?: (() => void) | undefined) => {
	notification.info({
		message: header,
		description:
			text,
		placement,
		onClick: onClick,
	});
};


export const stringToColor = (str: string) => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	let color = '#';
	for (let i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xFF;
		color += ('00' + value.toString(16)).substr(-2);
	}

	return color;
}