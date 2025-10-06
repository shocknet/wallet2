import { createAction, } from "@reduxjs/toolkit";
import { getNostrClient } from "@/Api/nostr";
import Bridge from "@/Api/bridge";
import { Buffer } from "buffer";
import { finalizeEvent, nip98 } from 'nostr-tools'
import { extractDomainFromUrl } from "@/lib/domain";
import { toast } from "react-toastify";
import { AppstartListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded } from "./actions";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { NprofileView, selectNprofileViews, selectSourceViewById } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
const { getToken } = nip98


export const upgradeSourcesToNofferBridge = createAction("upgradeSourcesToNofferBridge");

const enrollToBridge = async (source: NprofileView, dispatchCallback: (vanityname: string) => void) => {


	const nostrClient = await getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys);

	const userInfoRes = await nostrClient.GetUserInfo();
	if (userInfoRes.status !== "OK") {
		toast.error("Bridge Error: GetUserInfo failed!");
		throw new Error(userInfoRes.reason);
	}

	// we still get and send the k1 so that legacy mappings in bridge are moved to nofferMapping
	const lnurlPayLinkRes = await nostrClient.GetLnurlPayLink();
	let k1: string | undefined = undefined;
	if (lnurlPayLinkRes.status === "OK") {
		k1 = lnurlPayLinkRes.k1
	}

	const bridgeUrl = source.bridgeUrl || userInfoRes.bridge_url;
	if (!bridgeUrl) {
		toast.error("Bridge Error: No bridgeUrl from source or GetUserInfo response!");
		return;
	}


	const payload = { k1, noffer: userInfoRes.noffer }
	const nostrHeader = await getToken(`${bridgeUrl}/api/v1/noffer/vanity`, "POST", e => finalizeEvent(e, Buffer.from(source.keys.privateKey, 'hex')), true, payload)
	const bridgeHandler = new Bridge(bridgeUrl, nostrHeader);
	const bridgeRes = await bridgeHandler.GetOrCreateNofferName(payload);
	if (bridgeRes.status !== "OK") {
		toast.error("Bridge Error: GetOrCreateNofferName failed!");
		throw new Error(bridgeRes.reason);
	}
	const domainName = extractDomainFromUrl(bridgeUrl);

	dispatchCallback(`${bridgeRes.vanity_name}@${domainName}`)

}




export const addBridgeListener = (startAppListening: AppstartListening) => {
	startAppListening({
		actionCreator: identityLoaded,
		effect: async (action, listenerApi) => {
			listenerApi.unsubscribe();

			const task = listenerApi.fork(async () => {
				for (; ;) {
					const result = await listenerApi.take(
						(action) => upgradeSourcesToNofferBridge.match(action) || sourcesActions._createDraftDoc.match(action)
					);


					if (upgradeSourcesToNofferBridge.match(result[0])) {
						const sourceviews = selectNprofileViews(listenerApi.getState());
						await Promise.all(sourceviews.map(async source => enrollToBridge(
							source,
							(vanityName) => {
								listenerApi.dispatch(sourcesActions.setVanityName({ sourceId: source.sourceId, vanityName }));

							}
						)))
						return;
					} else if (sourcesActions._createDraftDoc.match(result[0])) {
						const source = selectSourceViewById(listenerApi.getState(), result[0].payload.sourceId)
						if (!source || source.type !== SourceType.NPROFILE_SOURCE) return;
						await enrollToBridge(
							source,
							(vanityName) => {
								listenerApi.dispatch(sourcesActions.setVanityName({ sourceId: source.sourceId, vanityName }));

							}
						)
					}
				}
			});

			await listenerApi.condition(identityUnloaded.match);
			task.cancel();
			listenerApi.subscribe();
		},
	})
}
