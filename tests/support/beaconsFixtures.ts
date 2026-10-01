import { canonicalRelayUrl } from "@/State/scoped/beacons/relays"
import {
	beaconRelayNodeKey,
	beaconRelayNodesAdapter,
	getInitialBeaconsState,
	type BeaconLookup,
	type BeaconRelayNode,
	type BeaconsState,
} from "@/State/scoped/beacons/state"

export type CreateTestBeaconNodeOpts = {
	lpk: string;
	relay: string;
	lastSeenAtMs?: number;
	name?: string;
	avatarUrl?: string;
	fees?: BeaconRelayNode["fees"];
	nextRelay?: string;
	lookup?: BeaconLookup;
};

export function createTestBeaconNode(opts: CreateTestBeaconNodeOpts): BeaconRelayNode {
	const relay = canonicalRelayUrl(opts.relay) ?? opts.relay;
	return {
		id: beaconRelayNodeKey(opts.lpk, relay),
		lpk: opts.lpk,
		relay,
		lastSeenAtMs: opts.lastSeenAtMs,
		name: opts.name,
		avatarUrl: opts.avatarUrl,
		fees: opts.fees,
		nextRelay: opts.nextRelay,
		lookup: opts.lookup,
	};
}

export function beaconsStateOf(...nodes: BeaconRelayNode[]): BeaconsState {
	return {
		nodes: beaconRelayNodesAdapter.setAll(
			getInitialBeaconsState().nodes,
			nodes,
		),
	};
}
