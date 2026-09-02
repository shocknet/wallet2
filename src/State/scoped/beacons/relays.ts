import { normalizeWsUrl } from "@/lib/url";

export function canonicalRelayUrl(relay: string): string | null {
	try {
		return normalizeWsUrl(relay);
	} catch {
		return null;
	}
}

export function canonicalRelayUrls(relays: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const relay of relays) {
		const n = canonicalRelayUrl(relay);
		if (!n || seen.has(n)) continue;
		seen.add(n);
		out.push(n);
	}
	return out.sort();
}
