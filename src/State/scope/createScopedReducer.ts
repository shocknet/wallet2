import { combineReducers } from "@reduxjs/toolkit";
import { identityModule } from "../scoped/backups/identity/slice";
import { sourcesModule } from "../scoped/backups/sources/slice";
import { beaconsModule } from "../scoped/beacons/slice";
import type { ScopedReducerContext } from "./scopedModule";

const scopedPersistKeys = [
	identityModule.persistKey,
	sourcesModule.persistKey,
	beaconsModule.persistKey,
] as const;

export function createScopedReducer(context: ScopedReducerContext) {
	return {
		reducer: combineReducers({
			identity: identityModule.createReducer(context),
			sources: sourcesModule.createReducer(context),
			beacons: beaconsModule.createReducer(context),
		}),
		persistKeys: scopedPersistKeys.map((persistKey) => persistKey(context.scopeId)),
	};
}
