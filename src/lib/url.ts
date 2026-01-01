import z from "zod";



interface UrlOk {
	ok: true;
	value: string;
	error?: never;
}

interface UrlBad {
	ok: false;
	error: string;
	value?: never;
}

type UrlResult = UrlOk | UrlBad;

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



function isValidHost(hostname: string): boolean {
	return (
		!!hostname &&
		(
			hostname === "localhost" ||
			z.regexes.ipv4.test(hostname) ||
			z.regexes.domain.test(hostname)
		)
	);
}

function hasCredentials(u: URL) {
	return u.username || u.password;
}


function sanitize(u: URL): UrlResult {
	if (hasCredentials(u)) return { ok: false, error: "URL must not have credentials" };

	if (!isValidHost(u.hostname)) return { ok: false, error: "Invalid/unsupported host" };

	if (u.port && u.port === DEFAULT_PORT[u.protocol]) u.port = "";

	u.searchParams.sort();

	u.pathname = u.pathname.replace(/\/+/g, "/");
	if (u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);

	u.hash = "";

	let value = u.toString();
	if (value.endsWith("/")) value = value.slice(0, -1)

	return { ok: true, value };
}


export function normalizeHttpUrl(input: string): UrlResult {
	const u = parseWithDefault(input, "https");
	if (!u) return { ok: false, error: "Invalid URL" };
	if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Only http(s) allowed" };

	return sanitize(u);
}




export function normalizeWsUrl(input: string): UrlResult {
	const u = parseWithDefault(input, "wss");
	if (!u) return { ok: false, error: "Invalid URL" };
	if (u.protocol !== "ws:" && u.protocol !== "wss:") return { ok: false, error: "Only ws(s) allowed" };

	return sanitize(u);
}
