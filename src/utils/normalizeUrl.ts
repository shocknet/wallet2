import normalize from "normalize-url";
import { parse } from "tldts";

type UrlScheme = "http" | "https" | "ws" | "wss";

type NormalizeUrlOptions = {
	defaultScheme: UrlScheme;
	allowedSchemes: readonly UrlScheme[];
};

function validateHost(url: URL): void {
	if (url.hostname === "localhost") {
		return;
	}
	// URL already validates IPv6 literals.
	if (url.hostname.startsWith("[")) {
		return;
	}

	const host = parse(url.hostname, {
		detectSpecialUse: true,
	});

	if (host.isIp) {
		return;
	}

	if (
		host.domain === null ||
		host.isIcann !== true ||
		host.isSpecialUse
	) {
		throw new Error("Invalid or unsupported domain");
	}
}

export function normalizeUrl(
	input: string,
	{ defaultScheme, allowedSchemes }: NormalizeUrlOptions,
): string {
	const raw = input.trim();

	if (!raw) {
		throw new Error("Invalid URL");
	}



	let url: URL;

	try {
		const normalized = normalize(raw, {
			defaultProtocol: defaultScheme,
			customProtocols: ["ws", "wss"],

			normalizeProtocol: true,
			forceHttp: false,
			forceHttps: false,

			stripAuthentication: false,
			stripHash: true,
			stripWWW: false,

			removeQueryParameters: false,
			sortQueryParameters: true,
			emptyQueryValue: "always",

			removeTrailingSlash: true,
			removeSingleSlash: false,
			removeDirectoryIndex: false,
			removeExplicitPort: false,
		});

		url = new URL(normalized);
	} catch {
		throw new Error("Invalid URL");
	}

	if (!allowedSchemes.some(scheme => url.protocol === `${scheme}:`)) {
		throw new Error(
			`Expected one of: ${allowedSchemes.join(", ")}`
		);
	}

	if (url.username || url.password) {
		throw new Error("URL credentials are not allowed");
	}

	validateHost(url);

	return url.toString();
}
