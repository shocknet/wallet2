import { WsUrlSchema } from "@/lib/urlZod";

export function canonicalRelayUrl(relay: string): string | null {
	const parsed = WsUrlSchema.safeParse(relay);
	return parsed.success ? parsed.data : null;
}

export function canonicalRelayUrls(relays: string[]): string[] {
	return [...new Set(
		relays.map(canonicalRelayUrl).filter(url => url !== null),
	)].sort();
}
