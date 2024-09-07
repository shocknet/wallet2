import { AnyAction, createAction, createListenerMiddleware, isAnyOf, ListenerEffectAPI, TypedStartListening } from "@reduxjs/toolkit";
import { addPaySources } from "./Slices/paySourcesSlice";
import { AppDispatch, State } from "./store";
import { PayTo } from "../globalTypes";
import { decodeNprofile } from "../custom-nip19";
import { getNostrClient } from "../Api";
import Bridge from "../Api/bridge";

export const upgradeSourcesToNofferBridge = createAction("upgradeSourcesToNofferBridge");


const enrollToBridge = async (source: PayTo, dispatchCallback: (vanityname: string) => void) => {
	const { pubkey, relays, bridge } = decodeNprofile(source.pasteField)
	if (bridge && bridge.length > 0) {
		const nostrClient = await getNostrClient({ pubkey, relays }, source.keys);

		const lnurlPayLinkRes = await nostrClient.GetLnurlPayLink();
		if (lnurlPayLinkRes.status !== "OK") {
			throw new Error(lnurlPayLinkRes.reason);
		}

		const userInfoRes = await nostrClient.GetUserInfo();
		if (userInfoRes.status !== "OK") {
			throw new Error(userInfoRes.reason);
		}

		const bridgeHandler = new Bridge(bridge[0]);
		const bridgeRes = await bridgeHandler.GetOrCreateVanityName(lnurlPayLinkRes.k1, userInfoRes.noffer);
		if (bridgeRes.status !== "OK") {
			throw new Error(bridgeRes.reason);
		}

		dispatchCallback(bridgeRes.vanity_name)
	}
}

export const bridgeListener = {
	matcher: isAnyOf(addPaySources, upgradeSourcesToNofferBridge),
	effect: async (action: AnyAction, listenerApi: ListenerEffectAPI<State, AppDispatch>) => {
		if (upgradeSourcesToNofferBridge.match(action)) {
			console.log("CALLLLLED")
			const paySources = listenerApi.getState().paySource;
			const nostrPayTos = Object.values(paySources.sources).filter(source => source.pubSource);
			await Promise.all(nostrPayTos.map(async source => enrollToBridge(
				source,
				(vanityName) => listenerApi.dispatch({ type: "paySources/editPaySources", payload: { ...source, vanityName }, meta: { skipChangelog: true } })
			)))
			return;
		}

		if (addPaySources.match(action)) {
			const source = action.payload.source;

			await enrollToBridge(
				source,
				(vanityName) => listenerApi.dispatch({ type: "paySources/editPaySources", payload: { ...source, vanityName }, meta: { skipChangelog: true } })
			)

		}
	}
}

export const bridgeMiddleware = createListenerMiddleware()
const typedStartListening = bridgeMiddleware.startListening as TypedStartListening<State, AppDispatch>
typedStartListening(bridgeListener);