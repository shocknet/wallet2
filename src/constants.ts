export const locationRegex = new RegExp(/\w{1,}/g)

export const HTTP_AUTH_TOKEN_STORAGE_KEY = "HTTP_AUTH_TOKEN"
export const NOSTR_PRIVATE_KEY_STORAGE_KEY = "NOSTR_PRIVATE_KEY"
export const NOSTR_PUBLIC_KEY_STORAGE_KEY = "NOSTR_PUBLIC_KEY"
export const NOSTR_RELAYS = ["wss://relay.unikku.com"]
export const NOSTR_PUB_DESTINATION = "e306c45ee0a7c772540f1dc88b00f79d2d3910bfd4047e910584998de9c9e2be";
export const usdToBTCSpotLink = "https://api.coinbase.com/v2/prices/BTC-USD/spot";
export const defaultMempool = "https://mempool.space/api/v1/fees/recommended";
export const options: any = {
    little: "A little.",
    very: "Very well.",
    mine: "It's my node.",
}
