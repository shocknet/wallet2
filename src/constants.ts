export const locationRegex = new RegExp(/\w{1,}/g)

export const HTTP_AUTH_TOKEN_STORAGE_KEY = "HTTP_AUTH_TOKEN"
export const NOSTR_PRIVATE_KEY_STORAGE_KEY = "NOSTR_PRIVATE_KEY"
export const NOSTR_PUBLIC_KEY_STORAGE_KEY = "NOSTR_PUBLIC_KEY"
export const NOSTR_RELAYS = ["wss://strfry.shock.network"]
export const NOSTR_PUB_DESTINATION = "5aa8d23ef9e6e7ad056a26136034ea813c178a53183b69c1927a1d7dbda79c32";
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
