
import type { PersistConfig } from "redux-persist";
import type { Action, Reducer } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";


export const getPersistConfigKey = (baseKey: string, scope: string) => `${baseKey}@${scope}`
export function makeScopedPersistedReducer<S>(
	reducer: Reducer<S, Action>,
	baseKey: string,
	scope: string,
	cfg: Omit<PersistConfig<S>, "key">
) {
	return persistReducer({ ...cfg, key: getPersistConfigKey(baseKey, scope) }, reducer);
}

