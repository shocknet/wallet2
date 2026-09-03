export type ParsedPeerUri = {
	pubkey: string;
	host: string;
	port: number;
};

export type ParsedPeerInput = {
	pubkey: string;
	host?: string;
	port?: number;
};

export function parsePeerUri(raw: string): ParsedPeerUri | { error: string } {
	const parsed = parsePeerInput(raw);
	if ("error" in parsed) return parsed;
	if (!parsed.host || parsed.port == null) {
		return { error: "Use pubkey@host:port" };
	}
	return { pubkey: parsed.pubkey, host: parsed.host, port: parsed.port };
}

export function parsePeerInput(raw: string): ParsedPeerInput | { error: string } {
	const trimmed = raw.trim();
	if (!trimmed) {
		return { error: "Enter a pubkey or pubkey@host:port" };
	}
	if (!trimmed.includes("@")) {
		return { pubkey: trimmed };
	}

	const at = trimmed.lastIndexOf("@");
	const pubkey = trimmed.slice(0, at);
	const addr = trimmed.slice(at + 1);
	if (!pubkey || !addr) {
		return { error: "Use pubkey@host:port" };
	}

	const endpoint = splitHostPort(addr);
	if ("error" in endpoint) {
		return endpoint;
	}

	return { pubkey, host: endpoint.host, port: endpoint.port };
}

function splitHostPort(addr: string): { host: string; port: number } | { error: string } {
	if (addr.startsWith("[")) {
		const end = addr.indexOf("]");
		if (end < 0 || addr[end + 1] !== ":") {
			return { error: "Use pubkey@host:port" };
		}
		return toHostPort(addr.slice(1, end), addr.slice(end + 2));
	}

	const colon = addr.lastIndexOf(":");
	if (colon < 0) {
		return { error: "Use pubkey@host:port" };
	}
	return toHostPort(addr.slice(0, colon), addr.slice(colon + 1));
}

function toHostPort(host: string, portStr: string): { host: string; port: number } | { error: string } {
	const port = Number(portStr);
	if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
		return { error: "Use pubkey@host:port" };
	}
	return { host, port };
}
