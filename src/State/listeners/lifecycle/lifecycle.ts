import { identityUnloaded, listenerKick } from "../actions";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";
import {
	addListener,
	type Dispatch,
	type ThunkDispatch,
	type TypedAddListener,
	type TypedStartListening,
	type UnknownAction,
	type UnsubscribeListener,
} from "@reduxjs/toolkit";
import dLogger from "@/Api/helpers/debugLog";

export type ListenerSpec<
	State = unknown,
	DispatchType extends Dispatch<UnknownAction> = ThunkDispatch<State, unknown, UnknownAction>,
> = {
	name: string;
	listeners: Array<(add: TypedAddListener<State, DispatchType>) => ReturnType<TypedAddListener<State, DispatchType>>>;
	beforeUnload?: (args: {
		dispatch: DispatchType;
		identityId: string;
	}) => Promise<void> | void;
};

export const addIdentityLifecycle = <
	State,
	DispatchType extends Dispatch<UnknownAction>,
>(
	startListening: TypedStartListening<State, DispatchType>,
	specs: readonly ListenerSpec<State, DispatchType>[],
) => {
	const addAppListener = addListener.withTypes<State, DispatchType>();
	let activeUnsubs: Array<UnsubscribeListener> = [];

	startListening({
		actionCreator: identitiesRegistryActions.setActiveIdentityRuntime,
		effect: async (_, listenerApi) => {
			const log = dLogger.withContext({
				procedure: "lifecycle api"
			});

			log.info("started");

			listenerApi.unsubscribe();

			for (const spec of specs) {
				for (const listener of spec.listeners) {
					const unsubscribe = listenerApi.dispatch(
						listener(addAppListener)
					) as unknown as UnsubscribeListener;
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
				try { unsub({ cancelActive: true }); } catch (err) {
					log.error("error unsubing listeners", { error: err });
				}
			}
			activeUnsubs = [];
			action.payload.deferred.resolve();

			log.info("ended");
			listenerApi.subscribe();
		},
	});
};
