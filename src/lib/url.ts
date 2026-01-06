import z from "zod";

const DEFAULT_PORT: Record<string, string> = {
	"http:": "80",
	"https:": "443",
	"ws:": "80",
	"wss:": "443",
};

function parseWithDefault(raw: string, def: "https" | "wss") {
	const s = raw.trim();
	if (!s) throw new Error("Invalid URL");
	try { return new URL(s); }
	catch {
		return new URL(`${def}://${s.replace(/^\/+/, "")}`);
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


function sanitize(u: URL) {
	if (hasCredentials(u)) throw new Error("URL must not have credentials");

	if (!isValidHost(u.hostname)) throw new Error("Invalid/unsupported host");

	if (u.port && u.port === DEFAULT_PORT[u.protocol]) u.port = "";

	u.searchParams.sort();

	u.pathname = u.pathname.replace(/\/+/g, "/");
	if (u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);

	u.hash = "";

	let value = u.toString();
	if (value.endsWith("/")) value = value.slice(0, -1)

	return value;
}


export function normalizeHttpUrl(input: string) {
	const u = parseWithDefault(input, "https");
	if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) allowed");

	return sanitize(u);
}




export function normalizeWsUrl(input: string) {
	const u = parseWithDefault(input, "wss");
	if (u.protocol !== "ws:" && u.protocol !== "wss:") throw new Error("Only ws(s) allowed");

	return sanitize(u);
}
