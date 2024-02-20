import CreateBridgeHttpClient, { BridgeHttpClient } from "./http"

export default class Handler {
	constructor(bridgeUrl: string) {
		console.log(bridgeUrl)
		this.bridgeHttp = CreateBridgeHttpClient(bridgeUrl);
	}
	bridgeHttp: BridgeHttpClient;


	async GetOrCreateVanityName(k1: string) {
		const res = await this.bridgeHttp.GetOrCreateVanityName({ k1 });
		if (res.status === 'ERROR') {
			throw new Error(res.reason)
		}
		return res;
	}
}