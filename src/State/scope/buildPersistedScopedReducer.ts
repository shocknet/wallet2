import type { PersistConfig } from "redux-persist";
import type { Action, Reducer } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";

export const getPersistConfigKey = (baseKey: string, scope: string) => `${baseKey}@${scope}`;

// persistReducer calls the base reducer with {} when there is no state yet,
// and a slice then keeps that empty object instead of its initial state.
function acceptEmptyAsInitial<S>(reducer: Reducer<S, Action>): Reducer<S, Action> {
	return (state, action) => {
		if (state === undefined || isEmptyRecord(state)) return reducer(undefined, action);
		return reducer(state, action);
	};
}

function isEmptyRecord(state: unknown): boolean {
	return typeof state === "object" && state !== null && !Array.isArray(state) && Object.keys(state).length === 0;
}

export function makeScopedPersistedReducer<S>(
	reducer: Reducer<S, Action>,
	baseKey: string,
	scope: string,
	cfg: Omit<PersistConfig<S>, "key">,
) {
	return persistReducer({
		...cfg,
		key: getPersistConfigKey(baseKey, scope),
	}, acceptEmptyAsInitial(reducer));
}
