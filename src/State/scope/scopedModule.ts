import type { Action, Reducer } from "@reduxjs/toolkit";
import { KEY_PREFIX, type Storage } from "redux-persist";

export type ScopeSession = {
	scopeId: string;
	dataKey: CryptoKey;
};

export type ScopedReducerContext = ScopeSession & {
	storage: Storage;
};

export type ScopedModule<R extends Reducer = Reducer> = {
	persistBaseKey: string;
	persistKey: (scopeId: string) => string;
	createReducer: (context: ScopedReducerContext) => R;
};

export function defineScopedModule<S>(module: {
	persistBaseKey: string;
	createReducer: (context: ScopedReducerContext) => Reducer<S, Action>;
}): ScopedModule<Reducer<S, Action>> {
	if (module.persistBaseKey.trim() === "") throw new Error("A scoped module needs a persist base key");
	return {
		persistBaseKey: module.persistBaseKey,
		persistKey: (scopeId) => scopedPersistKey(module.persistBaseKey, scopeId),
		createReducer: module.createReducer,
	};
}


export function scopedPersistKey(baseKey: string, scopeId: string) {
	return `${baseKey}@${scopeId}`;
}

export function scopedStorageKey(baseKey: string, scopeId: string) {
	return `${KEY_PREFIX}${scopedPersistKey(baseKey, scopeId)}`;
}
