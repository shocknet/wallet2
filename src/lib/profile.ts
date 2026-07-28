import { nip05 } from "nostr-tools";
import type { Event } from "nostr-tools";
import { fetchNostrUserMetadataEvent } from "@/Api/nostrHandler";
import { normalizeWsUrl } from "@/lib/url";

export type NostrProfile = {
	pubkey: string;
	name?: string;
	display_name?: string;
	picture?: string;
	about?: string;
	nip05?: string;
};



function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function normalizeRelays(relays: string[]): string[] {
	return relays.map(normalizeWsUrl).sort();
}

export function parseKind0ProfileContent(content: string): Omit<NostrProfile, "pubkey"> | null {
	try {
		const raw = JSON.parse(content) as Record<string, unknown>;
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
			return null;
		}

		return {
			name: asOptionalString(raw.name),
			display_name: asOptionalString(raw.display_name),
			picture: asOptionalString(raw.picture),
			about: asOptionalString(raw.about),
			nip05: asOptionalString(raw.nip05),
		};
	} catch {
		return null;
	}
}

export function profileFromKind0Event(
	pubkey: string,
	event: Event | null | undefined,
): NostrProfile | null {
	if (!event?.content) {
		return null;
	}

	const fields = parseKind0ProfileContent(event.content);
	return fields ? { pubkey, ...fields } : { pubkey };
}

export async function fetchProfile(
	pubkey: string,
	relays: string[],
): Promise<NostrProfile | null> {
	const event = await fetchNostrUserMetadataEvent(pubkey, normalizeRelays(relays));
	return profileFromKind0Event(pubkey, event);
}

export async function verifyNip05Claim(
	pubkey: string,
	nip05Claim: string,
): Promise<boolean> {
	if (!nip05.NIP05_REGEX.test(nip05Claim)) {
		return false;
	}

	const [name, domain] = nip05Claim.split("@");

	try {
		const res = await fetchNostrAddressWithThrow(name, domain);

		const entry = res.names[name] ?? null;
		if (!entry) {
			return false;
		}
		if (entry.toLowerCase() !== pubkey.toLowerCase()) {
			return false;
		}

		return true
	} catch {
		return false
	}
}


export interface NostrJson {
	names: Record<string, string>
	relays?: Record<string, Array<string>>
	nip46?: Record<string, Array<string>>
}
async function fetchNostrAddressWithThrow(name: string, domain: string, timeout = 5_000) {
	if (!name || !domain) {
		throw new Error("Name and Domain must be set")
	}
	const u = new URL(`https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`)
	const res = await fetch(u, {
		signal: AbortSignal.timeout(timeout),
	})
	const text = await res.text()
	if (res.ok) {
		const data = JSON.parse(text) as NostrJson
		if (!("names" in data)) {
			throw new Error(`Invalid response, code=${res.status}, body=${text}`)
		}
		return data
	} else {
		throw new Error(`Invalid response, code=${res.status}, body=${text}`)
	}
}
