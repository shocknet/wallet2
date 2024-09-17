
import CreateBridgeHttpClient, { BridgeHttpClient } from "./http"


export default class Handler {
	constructor(bridgeUrl: string, nostrHeader: string) {
		console.log(bridgeUrl)
		this.bridgeHttp = CreateBridgeHttpClient(bridgeUrl, nostrHeader);
	}
	bridgeHttp: BridgeHttpClient;


	async GetOrCreateNofferName({ noffer, k1 }: { noffer: string, k1?: string }) {
		return this.bridgeHttp.GetOrCreateNofferName({ k1, noffer });
		this.bridgeHttp.GetOrCreateNofferName.
	}
}