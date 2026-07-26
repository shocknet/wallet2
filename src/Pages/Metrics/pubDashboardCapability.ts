import { getNostrClient } from "@/Api/nostr";
import type { NostrKeyPair } from "@/Api/nostrHandler";

export type PubDashboardCapability = "supported" | "needs_upgrade";

type ProbeSource = {
	sourceId: string;
	lpk: string;
	relays: string[];
	keys: NostrKeyPair;
};

const inflightProbes = new Map<string, Promise<PubDashboardCapability>>();

export function isMissingDashboardRpcError(reason: string): boolean {
	const normalized = reason.toLowerCase();
	if (normalized.includes("unkown rpcname") || normalized.includes("unknown rpcname")) {
		return true;
	}
	const mentionsNewRpc =
		normalized.includes("getassetsandliabilitiesv2")
		|| normalized.includes("getusersadmininfo")
		|| normalized.includes("getuseroperationsfromadmin");
	return mentionsNewRpc && normalized.includes("not implemented");
}

/** Old Pubs swallow unknown RPCs; the client only sees a timeout. Probe-scoped. */
export function isProbeSilentFailure(reason: string): boolean {
	const normalized = reason.toLowerCase();
	return normalized.includes("request timed out")
		|| normalized.includes("nostr connection timeout")
		|| normalized === "invalid response";
}

async function runProbe(source: ProbeSource): Promise<PubDashboardCapability> {
	const client = await getNostrClient(
		{ pubkey: source.lpk, relays: source.relays },
		source.keys,
	);
	// Cheap RPC added in the same Pub release as Assets V2 / Users admin.
	const res = await client.GetUsersAdminInfo({ skip: 0, take: 1 });
	if (res.status === "ERROR") {
		if (isMissingDashboardRpcError(res.reason) || isProbeSilentFailure(res.reason)) {
			return "needs_upgrade";
		}
		throw new Error(res.reason);
	}
	return "supported";
}

/** Deduped probe. Caller owns caching (runtime slice). Throws on non-upgrade failures. */
export function probePubDashboardCapability(
	source: ProbeSource,
): Promise<PubDashboardCapability> {
	const existing = inflightProbes.get(source.sourceId);
	if (existing) return existing;

	const probe = runProbe(source).finally(() => {
		inflightProbes.delete(source.sourceId);
	});
	inflightProbes.set(source.sourceId, probe);
	return probe;
}
