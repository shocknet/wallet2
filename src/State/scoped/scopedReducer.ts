import { Action, combineSlices, Reducer } from "@reduxjs/toolkit";
import { getScopedSourcesPersistKey, getScopedSourcesReducer } from "./backups/sources/slice";
import { staticReducers } from "../store/staticReducers";
import { getScopedIdentityPersistKey, getScopedIdentityReducer } from "./backups/identity/slice";
import type { AppThunkDispatch } from "../store/store";
import { persistor } from "../store/store";


const emptyReducer = () => null;



function buildScopedReducer(identityPubkey: string) {
	return combineSlices({
		identity: getScopedIdentityReducer(identityPubkey),
		sources: getScopedSourcesReducer(identityPubkey),
	});
}

export function getAllScopedPersistKeys(identityPubkey: string) {
	return {
		identity: getScopedIdentityPersistKey(identityPubkey),
		sources: getScopedSourcesPersistKey(identityPubkey),
	}
}


const makeNullable = <S>(r: Reducer<S, Action>): Reducer<S | null, Action> => {
	return (state: S | null | undefined, action: Action) =>
		r(state === null ? undefined : state, action);
};
export const removeScoped = (dispatch: AppThunkDispatch) => {

	staticReducers.inject(
		{ reducerPath: "scoped", reducer: emptyReducer },
		{ overrideExisting: true },
	)
	dispatch({ type: "@@identity/removed" });
}


export function injectNewScopedReducer(identityPubkey: string, dispatch: AppThunkDispatch) {
	const scopedReducer = buildScopedReducer(identityPubkey);

	console.log("swapping");

	staticReducers.inject({
		reducerPath: "scoped",
		reducer: makeNullable(scopedReducer)
	}, { overrideExisting: true });

	dispatch({ type: "@@identity/swap" });
	persistor.persist()
}

declare module "../store/staticReducers" {
	export interface LazyLoadedSlices {
		scoped: ReturnType<ReturnType<typeof buildScopedReducer>> | null;
	}
}
