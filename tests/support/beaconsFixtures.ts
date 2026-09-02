import { canonicalRelayUrl } from "@/State/scoped/beacons/relays"
import {
	beaconLookupKey,
	beaconLookupsAdapter,
	beaconNodesAdapter,
	getInitialBeaconsState,
	type BeaconLookup,
	type BeaconLookupStatus,
	type BeaconNode,
	type BeaconsState,
} from "@/State/scoped/beacons/state"

export type CreateTestBeaconNodeOpts = {
	lpk: string;
	relays: Record<string, { lastSeenAtMs: number }>;
	name?: string;
	avatarUrl?: string;
	fees?: BeaconNode["fees"];
	nextRelay?: string;
};

export function createTestBeaconNode(opts: CreateTestBeaconNodeOpts): BeaconNode {
	const relays: BeaconNode["relays"] = {};
	for (const [url, presence] of Object.entries(opts.relays)) {
		const canonical = canonicalRelayUrl(url) ?? url;
		relays[canonical] = presence;
	}
	return {
		lpk: opts.lpk,
		name: opts.name,
		avatarUrl: opts.avatarUrl,
		fees: opts.fees,
		nextRelay: opts.nextRelay,
		relays,
	};
}

export type CreateTestBeaconLookupOpts = {
	lpk: string;
	relay: string;
	epoch?: number;
	status?: BeaconLookupStatus;
};

export function createTestBeaconLookup(opts: CreateTestBeaconLookupOpts): BeaconLookup {
	const relay = canonicalRelayUrl(opts.relay) ?? opts.relay;
	return {
		id: beaconLookupKey(opts.lpk, relay),
		lpk: opts.lpk,
		relay,
		epoch: opts.epoch ?? 1,
		status: opts.status ?? "done",
	};
}

export function beaconsStateOf(args: {
	nodes?: BeaconNode[];
	lookups?: BeaconLookup[];
} = {}): BeaconsState {
	return {
		nodes: beaconNodesAdapter.setAll(getInitialBeaconsState().nodes, args.nodes ?? []),
		lookups: beaconLookupsAdapter.setAll(getInitialBeaconsState().lookups, args.lookups ?? []),
	};
}
