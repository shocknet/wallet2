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
		|| normalized.includes("getuseroperationsfromadmin")
		|| normalized.includes("getadminnodesettings")
		|| normalized.includes("updateadminnodesettings");
	return mentionsNewRpc && normalized.includes("not implemented");
}

/** Older GetAdminNodeSettings payload is missing later fields. */
export function isStaleAdminNodeSettingsError(reason: string): boolean {
	const normalized = reason.toLowerCase();
	return normalized.includes("lsp_channel_threshold")
		|| normalized.includes("lsp_threshold_env_locked");
}

/** Old Pubs swallow unknown RPCs; the client only sees a timeout. Probe-scoped. */
export function isProbeSilentFailure(reason: string): boolean {
	const normalized = reason.toLowerCase();
	return normalized.includes("request timed out")
		|| normalized.includes("nostr connection timeout")
		|| normalized === "invalid response";
}

function errorReason(res: { status: "ERROR"; reason: string } | { status: "OK" }): string | null {
	return res.status === "ERROR" ? res.reason : null;
}

async function runProbe(source: ProbeSource): Promise<PubDashboardCapability> {
	const client = await getNostrClient(
		{ pubkey: source.lpk, relays: source.relays },
		source.keys,
	);

	// Baseline: exists on old and new Pubs. If this fails, Pub is unreachable / auth broken
	// — do not treat that as "needs upgrade".
	const baseline = await client.LndGetInfo({ nodeId: 0 });
	const baselineErr = errorReason(baseline);
	if (baselineErr) {
		throw new Error(baselineErr);
	}

	// Cheap RPC added in the same Pub release as Assets V2 / Users admin.
	const res = await client.GetUsersAdminInfo({ skip: 0, take: 1 });
	const reason = errorReason(res);
	if (reason == null) return "supported";

	// Baseline worked, so a missing/silent new RPC means the Pub is online but too old.
	if (isMissingDashboardRpcError(reason) || isProbeSilentFailure(reason)) {
		return "needs_upgrade";
	}
	throw new Error(reason);
}

type BaselineClient = {
	LndGetInfo: (req: { nodeId: number }) => Promise<{ status: string }>;
};

/** True when Manage settings RPC is missing or old, and Pub itself is still up. */
export const adminNodeSettingsNeedsUpgrade = async (
	reason: string,
	client: BaselineClient,
): Promise<boolean> => {
	if (isMissingDashboardRpcError(reason) || isStaleAdminNodeSettingsError(reason)) {
		return true;
	}
	if (!isProbeSilentFailure(reason)) return false;
	const baseline = await client.LndGetInfo({ nodeId: 0 });
	return baseline.status === "OK";
};

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
