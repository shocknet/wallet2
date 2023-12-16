export const locationRegex = new RegExp(/\w{1,}/g)

export const HTTP_AUTH_TOKEN_STORAGE_KEY = "HTTP_AUTH_TOKEN"
export const NOSTR_PRIVATE_KEY_STORAGE_KEY = "NOSTR_PRIVATE_KEY"
export const NOSTR_PUBLIC_KEY_STORAGE_KEY = "NOSTR_PUBLIC_KEY"
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
const LNURL_REGEX = /^(lightning:)?LNURL[0-9a-zA-Z]+$/;
const LN_ADDRESS_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;


export enum InputClassification {
    BITCOIN_ADDRESS = "BTC",
    LN_INVOICE = "INVOICE",
    LNURL = "LNURL",
    LN_ADDRESS = "LIGHTING_ADDRESS",
    UNKNOWN = "NO_IDEA"

}

export const classifyBitcoinInput = (input: string): { type: InputClassification, data: string } => {

    const removePrefix = (str: string, prefix: string) => str.startsWith(prefix) ? str.slice(prefix.length) : str;

    if (LN_INVOICE_REGEX.test(input)) {
        return { type: InputClassification.LN_INVOICE, data: removePrefix(input, "lightning:") };
    } else if (LNURL_REGEX.test(input)) {
        return { type: InputClassification.LNURL, data: removePrefix(input, "lightning:") };
    } else if (BITCOIN_ADDRESS_REGEX.test(input)) {
        return { type: InputClassification.BITCOIN_ADDRESS, data: removePrefix(input, "bitcoin:") };
    } else if (LN_ADDRESS_REGEX.test(input)) {
        return { type: InputClassification.LN_ADDRESS, data: input };
    } else {
        return { type: InputClassification.UNKNOWN, data: input };
    }
}

