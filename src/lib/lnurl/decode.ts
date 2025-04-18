import { bech32 } from "bech32";
import { type LightningAddress } from "../types/lnurl";



const LNURL_REGEX =
	/^(?:http.*[&?]lightning=|lightning:)?(lnurl[0-9]{1,}[02-9ac-hj-np-z]+)/

const LN_ADDRESS_REGEX =
	// eslint-disable-next-line no-useless-escape
	/^((?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@((?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/




export function decodeUrlOrAddress(lnUrlOrAddress: string): string | null {
	const bech32Url = parseLnUrl(lnUrlOrAddress);
	if (bech32Url) {
		const decoded = bech32.decode(bech32Url, 20000);
		bech32.fromWords(decoded.words);
		return new TextDecoder().decode(new Uint8Array(bech32.fromWords(decoded.words)));
	}

	const address = parseLightningAddress(lnUrlOrAddress);
	if (address) {
		const { username, domain } = address;
		return `https://${domain}/.well-known/lnurlp/${username}`;
	}

	return null;
}


function parseLnUrl(url: string): string | null {
	if (!url) return null;
	const result = LNURL_REGEX.exec(url.toLowerCase());
	return result ? result[1] : null;
}

function parseLightningAddress(
	address: string
): LightningAddress | null {
	if (!address) return null;
	const result = LN_ADDRESS_REGEX.exec(address.toLowerCase());
	return result ? { username: result[1], domain: result[2] } : null;
}


export function isLnurl(url: string): boolean {
	if (!url) return false;
	return LNURL_REGEX.test(url.toLowerCase());
}


export function isLightningAddress(address: string): boolean {
	if (!address) return false;
	return LN_ADDRESS_REGEX.test(address.toLowerCase());
}




export const isUrl = (url: string | null): url is string => {
	if (!url) return false;
	try {
		return !!new URL(url);
	} catch {
		return false;
	}
}

