import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from './store'
import { addHydrationListener } from '../identitiesRegistry/middleware/switcher';
import { addIdentityLifecycle } from '../listeners/lifecycle/lifecycle';
import { beaconWatcherSpec } from '../listeners/beaconWatcher/beaconWatcher';
import { bridgeListenerSpec } from '../listeners/bridgeListener/bridgeListener';
import { favInvariantpec } from '../listeners/favInvariantListener/favInvariantListener';
import { historySyncerSpec } from '../listeners/historySyncer/historySyncer';
import { liveRequestsListenerSpec } from '../listeners/liveRequests/liveRequests';
import { publisherSpec } from '../listeners/publisher/publisher';
import { pullerSpec } from '../listeners/puller/puller';




export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
	RootState,
	AppDispatch
>();

export type AppstartListening = typeof startAppListening;




const specs = [
	beaconWatcherSpec,
	bridgeListenerSpec,
	favInvariantpec,
	historySyncerSpec,
	liveRequestsListenerSpec,
	publisherSpec,
	pullerSpec
]

addHydrationListener(startAppListening);
addIdentityLifecycle(startAppListening, specs);

