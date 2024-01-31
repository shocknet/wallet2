import CreateBridgeHttpClient, { BridgeHttpClient } from "./http"

export default class Handler {
	constructor() {
		this.bridgeHttp = CreateBridgeHttpClient("https://zap.page");
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