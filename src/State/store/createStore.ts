import { configureStore, type Reducer, type ReducersMapObject } from "@reduxjs/toolkit";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistStore, type Storage } from "redux-persist";
import { historyFetchAllRequested, historyFetchSourceRequested, identityUnloaded } from "../listeners/actions";
import { createScopeHost, type ScopedReducerBundle } from "../scope/scopeHost";
import type { ScopedReducerContext, ScopeSession } from "../scope/scopedModule";

export function createStore<
	R extends ReducersMapObject,
	ScopedReducer extends Reducer,
	const Prepend extends readonly any[],
	const Append extends readonly any[],
>(options: {
	reducers: R;
	createScopedReducer: (context: ScopedReducerContext) => ScopedReducerBundle<ScopedReducer>;
	storage: Storage;
	prependMiddleware: Prepend;
	appendMiddleware: Append;
}) {
	if (Object.prototype.hasOwnProperty.call(options.reducers, "scoped")) {
		throw new Error("The scoped key is reserved for the scope host");
	}
	const host = createScopeHost(options.createScopedReducer, options.storage);
	const store = configureStore({
		reducer: {
			...options.reducers,
			scoped: host.reducer,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				serializableCheck: {
					ignoredActions: [
						FLUSH,
						PAUSE,
						PERSIST,
						REHYDRATE,
						PURGE,
						REGISTER,
						historyFetchAllRequested.type,
						historyFetchSourceRequested.type,
						identityUnloaded.type,
					],
				},
			}).prepend(...options.prependMiddleware).concat(...options.appendMiddleware),
	});
	const persistor = persistStore(store);
	return {
		store,
		persistor,
		mountScope: (session: ScopeSession) => host.mount(
			{ dispatch: (action) => store.dispatch(action as never) },
			persistor,
			session.scopeId,
			session.dataKey,
		),
	};
}

export type { ScopeSession };
