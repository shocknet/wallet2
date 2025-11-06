/*
import { addAppListener, type AppAddListener, type AppstartListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded, listenerKick } from "./actions";
import { addListener, UnsubscribeListener } from "@reduxjs/toolkit";



export type ListenerSpec = {
	name: string;
	listener: Parameters<AppAddListener>[0];
};

let SPECS: ListenerSpec[] = [];
export const __setSpecsForTest = (specs: ListenerSpec[]) => { SPECS = specs; };
export const bindOrchestrator = (startAppListening: AppstartListening) => {

	let activeUnsubs: Array<UnsubscribeListener> = [];


	startAppListening({
		actionCreator: identityLoaded,
		effect: async (_, listenerApi) => {
			// safety for hot re-register
			listenerApi.unsubscribe();


			for (const spec of SPECS) {
				const unsubscribe = listenerApi.dispatch(
					addAppListener(spec.listener)
				);


				activeUnsubs.push(unsubscribe);

				listenerApi.dispatch(listenerKick());
			}


			const [action] = await listenerApi.take(identityUnloaded.match);

			for (const unsub of activeUnsubs) {
				try { unsub({ cancelActive: true }); } catch { }
			}
			activeUnsubs = [];
			action.payload.deferred.resolve();

			listenerApi.subscribe();
		},
	});

};
 */
