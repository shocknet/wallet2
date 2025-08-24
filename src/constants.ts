import { Buffer } from 'buffer';
import { randomBytes } from "@noble/hashes/utils";
import { bech32 } from 'bech32';
import axios from "axios";
import { decode } from "@gandlaf21/bolt11-decode";
import { WALLET_CLIENT_KEY_STORAGE_KEY } from './Components/SanctumBox/helpers';
import { nip19 } from 'nostr-tools'
import { decodeBech32, OfferPointer } from '@shocknet/clink-sdk';
const { decode: decodeNip19 } = nip19

export const decodeNprofile = (data: string) => {
	const decoded = decodeNip19(data);
	if (decoded.type !== "nprofile") {
		throw new Error("Invalid nprofile")
	}
	return decoded.data
}
export const decodeNoffer = (data: string) => {
	const decoded = decodeBech32(data);
	if (decoded.type !== "noffer") {
		throw new Error("Invalid noffer")
	}
	return decoded.data
}

export const locationRegex = new RegExp(/\w{1,}/g)

export const keylinkAppId = import.meta.env.VITE_KEYLINK_APP_ID || ""
export const WALLET_URL = import.meta.env.WALLET_URL || "https://my.shockwallet.app"
export const DEVICE_ID_STORAGE_KEY = "DEVICE_ID"
export const HTTP_ADMIN_TOKEN_STORAGE_KEY = "HTTP_ADMIN_TOKEN"
export const HTTP_AUTH_TOKEN_STORAGE_KEY = "HTTP_AUTH_TOKEN"
export const NOSTR_PRIVATE_KEY_STORAGE_KEY = "NOSTR_PRIVATE_KEY"
export const SANCTUM_ACCESS_TOKEN_STORAGE_KEY = "SANCTUM_ACCESS_TOKEN"
export const NOSTR_PUBLIC_KEY_STORAGE_KEY = "NOSTR_PUBLIC_KEY"
export const NOSTR_RELAYS = ["wss://relay.lightning.pub"]
export const OLD_NOSTR_PUB_DESTINATION = "e306c45ee0a7c772540f1dc88b00f79d2d3910bfd4047e910584998de9c9e2be";
export const NOSTR_PUB_DESTINATION = import.meta.env.VITE_NOSTR_PUB_DESTINATION || "76ed45f00cea7bac59d8d0b7d204848f5319d7b96c140ffb6fcbaaab0a13d44e";
export const DEFAULT_BRIDGE_URL = import.meta.env.VITE_DEFAULT_BRIDGE_URL || "https://shockwallet.app";
export const defaultMempool = "https://mempool.space/api/v1/fees/recommended";
export const SANCTUM_URL = import.meta.env.VITE_SANCTUM_URL || "https://test-auth.shock.network"

// Firebase configuration fallbacks for Play Store builds
export const FIREBASE_CONFIG = import.meta.env.VITE_FIREBASE_CONFIG || JSON.stringify({
	apiKey: "AIzaSyA6YFA5tr2AHMVVXwLU00s_bVQekvXyN-w",
	authDomain: "shockwallet-11a9c.firebaseapp.com",
	projectId: "shockwallet-11a9c",
	storageBucket: "shockwallet-11a9c.firebasestorage.app",
	messagingSenderId: "73069543153",
	appId: "1:73069543153:web:048e09fb8a258acb7ab350",
	measurementId: "G-HQ89PZ3GPW"
});

export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BExGVgcmXFE2pMPG2iPGCyYINHGD6B_dzkcH3EqbzXK8bpS6uuSt_bs78blau2NrJoy";

export const TIMESTAMP_STORAGE_KEY = "BACKUP_TIMESTAMP";
export const VERSION_STORAGE_KEY = "BACKUP_VERSION";
export const CHANGELOG_TIMESTAMP = "CHANGELOG_TIMESTAMP";
export const STATE_HASH = "STATE_HASH";
export const options: any = {
	little: "A little.",
	very: "Very well.",
	mine: "It's my node.",
}
export const ignoredStorageKeys = [DEVICE_ID_STORAGE_KEY, SANCTUM_ACCESS_TOKEN_STORAGE_KEY, WALLET_CLIENT_KEY_STORAGE_KEY]

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
const NOFFER_REGEX = /^(lightning:)?[Nn][Oo][Ff][Ff][Ee][Rr][0-9a-zA-Z]+$/;
const LN_ADDRESS_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;


export enum InputClassification {
	BITCOIN_ADDRESS = "BTC",
	LN_INVOICE = "INVOICE",
	LNURL = "LNURL",
	LN_ADDRESS = "LIGHTING_ADDRESS",
	UNKNOWN = "NO_IDEA",
	NOFFER = "NOFFER"
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
	memo?: string
	noffer?: OfferPointer
}

export const decodeLnurl = (lnurl: string) => {
	const { words } = bech32.decode(lnurl, 2000);
	const sourceURL = bech32.fromWords(words);
	const buffer = new Uint8Array(sourceURL);
	const lnurlEndpoint = new TextDecoder().decode(buffer);
	return lnurlEndpoint;
}

export const decodeInvoice = (invoice: string) => {
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
	let amount = 0;
	if (amountSection) {
		amount = amountSection.value / 1000;
	} else {
		throw new Error("Error decoding provided invoice");
	}
	return { amount, description };
}

export const parseBitcoinInput = async (input: string): Promise<Destination> => {
	const removePrefixIfExists = (str: string, prefix: string) => str.startsWith(prefix) ? str.slice(prefix.length) : str;

	if (LN_INVOICE_REGEX.test(input)) {
		const invoice = removePrefixIfExists(input, "lightning:");
		const { amount, description } = decodeInvoice(invoice);

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
		};
		/* } else if (BITCOIN_ADDRESS_REGEX.test(input)) {
			const btcAddress = removePrefixIfExists(input, "bitcoin:");
			const isValidAddress = validate(btcAddress);
			if (!isValidAddress) {
				throw new Error("Invalid bitcoin address provided");
			}
			return {
				type: InputClassification.BITCOIN_ADDRESS,
				data: btcAddress
			}; */
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
			noffer: res.data.nip69 && decodeNoffer(res.data.nip69)

		};
	} else if (NOFFER_REGEX.test(input)) {
		const noffer = removePrefixIfExists(input, "lightning:");
		const decoded = decodeNoffer(noffer);
		return {
			type: InputClassification.NOFFER,
			data: input,
			noffer: decoded
		}


	} else {
		return { type: InputClassification.UNKNOWN, data: input };
	}
}







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

export const getDeviceId = () => {
	const stored = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
	if (stored) {
		return stored
	}
	const newId = Buffer.from(randomBytes(32)).toString('hex')
	localStorage.setItem(DEVICE_ID_STORAGE_KEY, newId)
	return newId

}



export const makeId = (length: number) => {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
