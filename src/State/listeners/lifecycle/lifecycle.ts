
import { type AppstartListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded, listenerKick } from "../actions";
import { addListener, type UnsubscribeListener } from "@reduxjs/toolkit";
import type { AppDispatch, AppThunkDispatch, RootState } from "@/State/store/store";

type ListenerRegistration = (add: AppAddListener) => ReturnType<AppAddListener>;
export type ListenerSpec = {
	name: string;
	listeners: ListenerRegistration[];
	beforeUnload?: (args: {
		dispatch: AppThunkDispatch;
		identityId: string;
	}) => Promise<void> | void;
};

const addAppListener = addListener.withTypes<RootState, AppDispatch>();
type AppAddListener = typeof addAppListener;


export const addIdentityLifecycle = (startAppListening: AppstartListening, specs: ListenerSpec[]) => {

	let activeUnsubs: Array<UnsubscribeListener> = [];


	startAppListening({
		actionCreator: identityLoaded,
		effect: async (_, listenerApi) => {

			listenerApi.unsubscribe();


			for (const spec of specs) {
				for (const listener of spec.listeners) {

					const unsubscribe = listenerApi.dispatch(
						listener(addAppListener)
					);


					activeUnsubs.push(unsubscribe);
				}

			}

			// Some of the middleware don't want to "listen" for something, they just
			// want to start some long running process right away. So we "kick" them
			// to start them
			listenerApi.dispatch(listenerKick());


			const [action] = await listenerApi.take(identityUnloaded.match);



			const pre = specs
				.map(s =>
					s.beforeUnload?.({
						dispatch: listenerApi.dispatch,

						identityId: "gibberish",
					})
				)
				.filter(Boolean) as Promise<void>[];

			// TODO: add timeout for beforeUnloads
			await Promise.allSettled(pre);

			for (const unsub of activeUnsubs) {
				try { unsub({ cancelActive: true }); } catch { /*  */ }
			}
			activeUnsubs = [];
			action.payload.deferred.resolve();

			listenerApi.subscribe();
		},
	});

};

