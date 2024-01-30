import CreateBridgeHttpClient, { BridgeHttpClient } from "./http"

export default class Handler {
	constructor() {
		this.bridgeHttp = CreateBridgeHttpClient("http://localhost:6969");
	}
	bridgeHttp: BridgeHttpClient;


	async GetOrCreateVanityName(userId: string) {
		const res = await this.bridgeHttp.GetOrCreateVanityName({ user_id: userId });
		if (res.status === 'ERROR') {
			throw new Error(res.reason)
		}
		return res;
	}
}