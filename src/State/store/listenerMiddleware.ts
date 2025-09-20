import { createListenerMiddleware, addListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from './store'



export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
	RootState,
	AppDispatch
>();

export type AppstartListening = typeof startAppListening;

export const addAppListener = addListener.withTypes<RootState, AppDispatch>();
