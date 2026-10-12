import { Action, createListenerMiddleware, type ThunkAction, type ThunkDispatch } from "@reduxjs/toolkit";
import { useDispatch as originalUseDispatch, useSelector as originalUseSelector } from "react-redux";
import { appApi } from "../api/api";
import "../api/offers";
import { addIdentityLifecycle } from "../listeners/lifecycle/lifecycle";
import { createScopedReducer, type AppScopeSession } from "../scope/createScopedReducer";
import { createStore, type StoreExtra } from "./createStore";
import { listenerSpecs } from "./listenerMiddleware";
import { createRootReducer } from "./staticReducers";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";

const listenerMiddleware = createListenerMiddleware();

const created = createStore({
	reducers: createRootReducer(IonicStorageAdapter),
	createScopedReducer,
	storage: IonicStorageAdapter,
	prependMiddleware: [listenerMiddleware.middleware],
	appendMiddleware: [appApi.middleware],
});

export const store = created.store;
export const persistor = created.persistor;
export const mountScope = created.mountScope;

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunkDispatch = ThunkDispatch<RootState, StoreExtra<AppScopeSession>, Action>;
export type AppThunk<T> = ThunkAction<
	T,
	RootState,
	StoreExtra<AppScopeSession>,
	Action
>;


addIdentityLifecycle(
	listenerMiddleware.startListening.withTypes<RootState, AppDispatch>(),
	listenerSpecs,
);

export const useDispatch: () => AppDispatch = originalUseDispatch;
export const useSelector = <TSelected = unknown>(
	selector: (state: RootState) => TSelected,
	equalityFn?: (left: TSelected, right: TSelected) => boolean
): TSelected => originalUseSelector<RootState, TSelected>(selector, equalityFn);

export default store;
