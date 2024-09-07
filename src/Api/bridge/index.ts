import CreateBridgeHttpClient, { BridgeHttpClient } from "./http"

export default class Handler {
	constructor(bridgeUrl: string) {
		console.log(bridgeUrl)
		this.bridgeHttp = CreateBridgeHttpClient(bridgeUrl);
	}
	bridgeHttp: BridgeHttpClient;


	async GetOrCreateVanityName(k1: string, noffer?: string) {
		return this.bridgeHttp.GetOrCreateVanityName({ k1, noffer });
	}
}