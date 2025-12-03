import { describe, it, expect } from "vitest";
import { canonicalHttpBase, canonicalRelayBase } from "./url";

describe("canonicalHttpBase", () => {
	it("defaults to https when no scheme is given", () => {
		const r = canonicalHttpBase("example.com");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com",
		});
	});

	it("keeps http and strips default :80", () => {
		const r = canonicalHttpBase("http://EXAMPLE.com:80/path?q=1#frag");
		expect(r).toEqual({
			ok: true,
			value: "http://example.com",
		});
	});

	it("keeps https and strips default :443", () => {
		const r = canonicalHttpBase("https://example.com:443/foo");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com",
		});
	});

	it("preserves non-default ports", () => {
		const r = canonicalHttpBase("https://example.com:8443/foo/bar?x=1");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com:8443",
		});
	});

	it("lowercases the hostname", () => {
		const r = canonicalHttpBase("HTTPS://MiXeD.CaSe.DomAin.Com");
		expect(r).toEqual({
			ok: true,
			value: "https://mixed.case.domain.com",
		});
	});

	it("rejects non-http(s) schemes", () => {
		const r = canonicalHttpBase("ftp://example.com");
		expect(r).toEqual({
			ok: false,
			error: "Only http(s) allowed",
		});
	});

	it("rejects blank/whitespace", () => {
		const r = canonicalHttpBase("   ");
		expect(r).toEqual({
			ok: false,
			error: "Invalid URL",
		});
	});

	it("rejects empty string", () => {
		const r = canonicalHttpBase("");
		expect(r).toEqual({
			ok: false,
			error: "Invalid URL",
		});
	});

	it("rejects single-label hosts without a dot", () => {
		const r = canonicalHttpBase("http://nice");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});

	it("rejects localhost", () => {
		const r = canonicalHttpBase("http://localhost:3000");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});

	it("rejects IPv4 literal", () => {
		const r = canonicalHttpBase("http://192.168.0.10:8080");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});

	it("rejects IPv6 literal", () => {
		const r = canonicalHttpBase("http://[::1]:8080");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});

	it("accepts URLs with embedded credentials (they get normalized to host only)", () => {
		const r = canonicalHttpBase("https://user:pass@example.com/some/path");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com",
		});
	});

	it("always yields trailing slash even if there was a path/query/hash", () => {
		const r = canonicalHttpBase("https://EXAMPLE.com////foo////bar?b=2&a=1#zzz");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com",
		});
	});
});

describe("canonicalRelayBase", () => {
	it("defaults to wss when no scheme is given", () => {
		const r = canonicalRelayBase("Relay.Example.com");
		expect(r).toEqual({
			ok: true,
			value: "wss://relay.example.com",
		});
	});

	it("keeps ws and strips default :80", () => {
		const r = canonicalRelayBase("ws://relay.example.com:80/some/path");
		expect(r).toEqual({
			ok: true,
			value: "ws://relay.example.com",
		});
	});

	it("keeps wss and strips default :443", () => {
		const r = canonicalRelayBase("wss://relay.example.com:443/////");
		expect(r).toEqual({
			ok: true,
			value: "wss://relay.example.com",
		});
	});

	it("preserves non-default port on relay URLs", () => {
		const r = canonicalRelayBase("wss://relay.example.com:7443/");
		expect(r).toEqual({
			ok: true,
			value: "wss://relay.example.com:7443",
		});
	});

	it("rejects http(s) for relay", () => {
		const r = canonicalRelayBase("https://relay.example.com");
		expect(r).toEqual({
			ok: false,
			error: "Only ws(s) allowed",
		});
	});

	it("rejects bare single-label host", () => {
		const r = canonicalRelayBase("wss://nic/");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});

	it("rejects localhost for relay", () => {
		const r = canonicalRelayBase("wss://localhost:7443");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});

	it("rejects IPv4 relay targets", () => {
		const r = canonicalRelayBase("ws://10.0.0.5:9001");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});

	it("accepts creds syntactically and normalizes to host only", () => {
		// same story as http: you're not banning .username/.password
		const r = canonicalRelayBase("wss://user:pass@relay.example.com:443");
		expect(r).toEqual({
			ok: true,
			value: "wss://relay.example.com",
		});
	});

	it("always yields trailing slash even with long path/query/hash", () => {
		const r = canonicalRelayBase("wss://RELAY.example.com////foo/bar?b=2&a=1#zzz");
		expect(r).toEqual({
			ok: true,
			value: "wss://relay.example.com",
		});
	});
});
