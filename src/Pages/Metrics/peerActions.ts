import { getNostrClient } from "@/Api/nostr";
import { parsePeerInput } from "@/lib/parsePeerUri";
import { AdminRpcSource } from "@/State/scoped/backups/sources/selectors";

export async function adminClient(adminSource: AdminRpcSource) {
	return getNostrClient(
		{ pubkey: adminSource.lpk, relays: adminSource.relays },
		adminSource.keys
	);
}

export function isAlreadyConnected(reason: string) {
	const r = reason.toLowerCase();
	return r.includes("already connected") || r.includes("already exists");
}

export async function connectPeer(
	adminSource: AdminRpcSource,
	peer: { pubkey: string; host: string; port: number }
): Promise<string | null> {
	const client = await adminClient(adminSource);
	const res = await client.AddPeer(peer);
	if (res.status === "ERROR" && !isAlreadyConnected(res.reason)) {
		return res.reason;
	}
	return null;
}

export async function openChannel(
	adminSource: AdminRpcSource,
	req: { node_pubkey: string; local_funding_amount: number; sat_per_v_byte: number }
): Promise<string | null> {
	const client = await adminClient(adminSource);
	const res = await client.OpenChannel(req);
	return res.status === "ERROR" ? res.reason : null;
}

export function parseOpenPeer(raw: string) {
	return parsePeerInput(raw);
}
