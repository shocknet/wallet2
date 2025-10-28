import { getNostrClient } from "@/Api/nostr";
import Bridge from "@/Api/bridge";
import { Buffer } from "buffer";
import { finalizeEvent, nip98 } from 'nostr-tools'
import { extractDomainFromUrl } from "@/lib/domain";
import { toast } from "react-toastify";
import { AppstartListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded } from "./actions";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { NprofileView, selectSourceViewById } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
const { getToken } = nip98




const enrollToBridge = async (source: NprofileView, dispatchCallback: (vanityname: string) => void) => {

	if (source.vanityName?.includes("lightning.video")) return;


	const nostrClient = await getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys);

	const userInfoRes = await nostrClient.GetUserInfo();
	if (userInfoRes.status !== "OK") {
		if (userInfoRes.reason !== "identity-switch") {

			throw new Error(userInfoRes.reason);
		}
		return
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
		effect: async (_action, listenerApi) => {

			listenerApi.unsubscribe();


			const task = listenerApi.fork(async forkApi => {

				try {
					for (; ;) {

						const result = await forkApi.pause(listenerApi.take(
							(action) =>
								sourcesActions._createDraftDoc.match(action) ||
								sourcesActions.applyRemoteSource.match(action)
						));

						const sourceId = result[0].payload.sourceId

						const source = selectSourceViewById(
							listenerApi.getState(),
							sourceId
						);

						if (
							!source ||
							source.type !== SourceType.NPROFILE_SOURCE
						) {
							continue;
						}


						listenerApi.fork(async () => {
							let alive = true;
							const abortHandler = () => {
								alive = false;
							};
							forkApi.signal.addEventListener(
								"abort",
								abortHandler
							);

							try {
								await enrollToBridge(
									source,
									(vanityName) => {
										// Don't dispatch if identity already unloaded
										if (!alive) return;

										listenerApi.dispatch(
											sourcesActions.setVanityName({
												sourceId: source.sourceId,
												vanityName,
											})
										);
									}
								);
							} catch (err) {
								if (alive) {
									console.error(
										"Bridge Error: enrollToBridge failed",
										err
									);
									toast.error(
										"Bridge Error: enrollment failed!"
									);
								}
							} finally {
								forkApi.signal.removeEventListener(
									"abort",
									abortHandler
								);
							}
						});
					}
				} catch (err: any) {

					if (err.name !== "TaskAbortError") {
						console.error("bridge listener loop crashed", err);
					}
				}
			});


			await listenerApi.condition(identityUnloaded.match);


			task.cancel();


			listenerApi.subscribe();
		},
	});
};
