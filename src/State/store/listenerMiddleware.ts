import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from './store'
import { addPublisherListener } from '../identitiesRegistry/middleware/publisher';
import { addDocsPullerListener } from '../identitiesRegistry/middleware/puller';
import { addHydrationListener } from '../identitiesRegistry/middleware/switcher';
import { addBridgeListener } from '../identitiesRegistry/middleware/bridgeListener';
import { addLiveRequestsListener } from '../identitiesRegistry/middleware/liveRequestsListener';
import { addBeaconWatcherListener } from '../identitiesRegistry/middleware/beaconWatcher';




export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
	RootState,
	AppDispatch
>();

export type AppstartListening = typeof startAppListening;


addPublisherListener(startAppListening);
addDocsPullerListener(startAppListening);
addHydrationListener(startAppListening);
addBridgeListener(startAppListening);
addLiveRequestsListener(startAppListening);
addBeaconWatcherListener(startAppListening)
