import { beaconWatcherSpec } from '../scoped/beacons/beaconWatcher';
import { bridgeListenerSpec } from '../listeners/bridgeListener/bridgeListener';
import { historySyncerSpec } from '../listeners/historySyncer/historySyncer';
import { liveRequestsListenerSpec } from '../listeners/liveRequests';
import { publisherSpec } from '../listeners/publisher/publisher';
import { pullerSpec } from '../listeners/puller/puller';
import { pushEnrollmentSpec } from '../listeners/push/push';
import { topicIndexSyncSpec } from '../listeners/topicIndexSync/topicIndexSync';
import { pendingClinkRequestsListenerSpec } from '../clinkRequests/clinkRequestsListener';

export const listenerSpecs = [
	beaconWatcherSpec,
	bridgeListenerSpec,
	historySyncerSpec,
	liveRequestsListenerSpec,
	publisherSpec,
	pullerSpec,
	pushEnrollmentSpec,
	topicIndexSyncSpec,
	pendingClinkRequestsListenerSpec
];
