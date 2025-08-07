import { addListener, createListenerMiddleware, ListenerEffectAPI, PayloadAction, TypedStartListening } from "@reduxjs/toolkit";
import { flipSourceNdebitDiscoverable } from "./Slices/paySourcesSlice";
import { AppDispatch, dynamicMiddleware, State } from "./store";
import { PayTo } from "../globalTypes";
import Bridge from "../Api/bridge";
import { Buffer } from "buffer";
import { finalizeEvent, nip98 } from 'nostr-tools'
const { getToken } = nip98



export const ndebitDiscoverableListener = {
	actionCreator: flipSourceNdebitDiscoverable,
	effect: async (action: PayloadAction<PayTo>, listenerApi: ListenerEffectAPI<State, AppDispatch>) => {
		const paySource = action.payload;
		const counterpartSpendSource = listenerApi.getState().spendSource.sources[paySource.id];
		if (paySource.bridgeUrl) {
			if (paySource.isNdebitDiscoverable && counterpartSpendSource.ndebit) {
				const payload = { ndebit: counterpartSpendSource.ndebit }
				const nostrHeader = await getToken(`${paySource.bridgeUrl}/api/v1/noffer/update/ndebit`, "POST", e => finalizeEvent(e, Buffer.from(paySource.keys.privateKey, 'hex')), true, payload)
				const bridgeHandler = new Bridge(paySource.bridgeUrl, nostrHeader);
				const res = await bridgeHandler.UpdateMappingNdebit(payload)
				if (res.status !== "OK") {
					throw new Error(res.reason);
				}
			} else if (!paySource.isNdebitDiscoverable) {
				const payload = {}
				const nostrHeader = await getToken(`${paySource.bridgeUrl}/api/v1/noffer/update/ndebit`, "POST", e => finalizeEvent(e, Buffer.from(paySource.keys.privateKey, 'hex')), true, payload)
				const bridgeHandler = new Bridge(paySource.bridgeUrl, nostrHeader);
				const res = await bridgeHandler.UpdateMappingNdebit(payload)
				if (res.status !== "OK") {
					throw new Error(res.reason);
				}
			}
		}
	}
}

const ndebitMiddleware = createListenerMiddleware()
export const addNdebitDiscoverableListener = addListener.withTypes<State, AppDispatch>();
export const useNdebitDiscoverableDipstach = dynamicMiddleware.createDispatchWithMiddlewareHook(ndebitMiddleware.middleware);
