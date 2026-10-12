import { Action, combineReducers, type Reducer } from "@reduxjs/toolkit";
import { identityModule } from "../scoped/backups/identity/slice";
import { sourcesModule } from "../scoped/backups/sources/slice";
import { beaconsModule } from "../scoped/beacons/slice";
import type { ScopedRuntimeIdentity } from "@/shell/types";
import type { ScopeSession, ScopedReducerContext } from "./scopedModule";

export type AppScopeSession = ScopeSession & {
	dataKey: CryptoKey;
	runtimeIdentity: ScopedRuntimeIdentity;
};

export type AppScopedReducerContext = AppScopeSession & Pick<ScopedReducerContext, "storage">;

const scopedModules = [
	{ key: "identity", module: identityModule },
	{ key: "sources", module: sourcesModule },
	{ key: "beacons", module: beaconsModule },
] as const;

type ScopedModuleEntry = (typeof scopedModules)[number];

type PersistedReducers = {
	[E in ScopedModuleEntry as E["key"]]: ReturnType<E["module"]["createReducer"]>;
};

function persistedReducers(context: AppScopedReducerContext) {
	const reducers = {} as PersistedReducers;
	const persistKeys: string[] = [];
	for (const entry of scopedModules) {
		const persistKey = entry.module.persistKey(context.scopeId);
		if (persistKey.trim() === "") {
			throw new Error(`Scoped reducer ${entry.key} has no persist key`);
		}
		if (persistKeys.includes(persistKey)) {
			throw new Error(`Scoped persist key ${persistKey} is registered more than once`);
		}
		(reducers as Record<string, Reducer>)[entry.key] = entry.module.createReducer(context);
		persistKeys.push(persistKey);
	}
	return { reducers, persistKeys };
}

export function createScopedReducer(context: AppScopedReducerContext) {
	const runtimeIdentity = context.runtimeIdentity;
	const persisted = persistedReducers(context);
	return {
		reducer: combineReducers({
			...persisted.reducers,
			runtimeIdentity: (
				state: ScopedRuntimeIdentity = runtimeIdentity,
				_action: Action,
			) => state,
		}),
		persistKeys: persisted.persistKeys,
	};
}
