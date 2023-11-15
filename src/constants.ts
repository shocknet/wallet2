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
