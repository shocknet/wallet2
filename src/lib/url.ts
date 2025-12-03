import z from "zod";

type Canon = { ok: true; value: string } | { ok: false; error: string };

const DEFAULT_PORT: Record<string, string> = {
	"http:": "80",
	"https:": "443",
	"ws:": "80",
	"wss:": "443",
};

function parseWithDefault(raw: string, def: "https" | "wss"): URL | null {
	const s = raw.trim();
	if (!s) return null;
	try { return new URL(s); }
	catch {
		try { return new URL(`${def}://${s.replace(/^\/+/, "")}`); }
		catch { return null; }
	}
}



function validateHost(hostname: string): boolean {
	return !!hostname && z.regexes.domain.test(hostname);
}


function stripDefaultPort(u: URL) {
	if (u.port && u.port === DEFAULT_PORT[u.protocol]) u.port = "";
}

function canonicalBase(u: URL): string {
	// Lowercase host; punycode happens automatically in URL
	u.hostname = u.hostname.toLowerCase();
	stripDefaultPort(u);
	// Return just scheme + host(+non-default port)
	return `${u.protocol}//${u.host}`;
}

/** Canonical base for HTTP(S). Defaults to https when omitted. */
export function canonicalHttpBase(input: string): Canon {
	const u = parseWithDefault(input, "https");
	if (!u) return { ok: false, error: "Invalid URL" };
	if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Only http(s) allowed" };

	if (!validateHost(u.hostname)) return { ok: false, error: "Invalid/unsupported host" };
	// ignore path/query/fragment entirely
	return { ok: true, value: canonicalBase(u) };
}

/** Canonical base for WS(S). Defaults to wss when omitted. */
export function canonicalRelayBase(input: string): Canon {
	const u = parseWithDefault(input, "wss");
	if (!u) return { ok: false, error: "Invalid URL" };
	if (u.protocol !== "ws:" && u.protocol !== "wss:") return { ok: false, error: "Only ws(s) allowed" };
	if (!validateHost(u.hostname)) return { ok: false, error: "Invalid/unsupported host" };
	return { ok: true, value: canonicalBase(u) };
}
