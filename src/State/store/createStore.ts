
import { configureStore, type Reducer, type ReducersMapObject } from "@reduxjs/toolkit";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistStore, type Storage } from "redux-persist";
import { historyFetchAllRequested, historyFetchSourceRequested, identityUnloaded } from "../listeners/actions";
import { createScopeHost, type ScopedReducerBundle } from "../scope/scopeHost";
import type { ScopeSession } from "../scope/scopedModule";

export type StoreExtra<Session extends ScopeSession = ScopeSession> = {
	mountScope: (
		session: Session,
		options?: { beforeCommit?: () => Promise<void> | void },
	) => Promise<void>;
};

function rootReducers<R extends ReducersMapObject, S extends Reducer>(
	reducers: R,
	scoped: S,
): Omit<R, "scoped"> & { scoped: S } {
	return { ...reducers, scoped };
}

export function createStore<
	Session extends ScopeSession,
	R extends ReducersMapObject,
	ScopedReducer extends Reducer,
	const Prepend extends readonly any[],
	const Append extends readonly any[],
>(options: {
	reducers: R;
	createScopedReducer: (context: Session & { storage: Storage }) => ScopedReducerBundle<ScopedReducer>;
	storage: Storage;
	prependMiddleware: Prepend;
	appendMiddleware: Append;
}) {
	if (Object.prototype.hasOwnProperty.call(options.reducers, "scoped")) {
		throw new Error("The scoped key is reserved for the scope host");
	}
	const host = createScopeHost(options.createScopedReducer, options.storage);
	const extra: StoreExtra<Session> = {
		mountScope: () => Promise.reject(new Error("mountScope is not ready")),
	};
	const store = configureStore({
		reducer: rootReducers(options.reducers, host.reducer),
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				thunk: { extraArgument: extra },
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
	extra.mountScope = (session, options) => host.mount(
		{ dispatch: (action) => store.dispatch(action as never) },
		persistor,
		session,
		options,
	);
	return { store, persistor, mountScope: extra.mountScope };
}

export type { ScopeSession };
