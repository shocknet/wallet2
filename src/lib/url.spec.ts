import { describe, it, expect } from "vitest";
import { normalizeHttpUrl, normalizeWsUrl } from "./url";

describe("normalizeHttpUrl", () => {
	it("defaults to https when no scheme is given", () => {
		const r = normalizeHttpUrl("example.com");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com",
		});
	});

	it("keeps http and strips default :80. No trailing slash", () => {
		const r = normalizeHttpUrl("http://example.com:80/");
		expect(r).toEqual({
			ok: true,
			value: "http://example.com",
		});
	});

	it("preserves query params, sorted, and drops hashes", () => {
		const r = normalizeHttpUrl("https://example.com/nice?b=12&a=15#hash");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com/nice?a=15&b=12",
		});
	});

	it("preserves non-default ports", () => {
		const r = normalizeHttpUrl("https://example.com:8443");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com:8443",
		});
	});

	it("lowercases the hostname", () => {
		const r = normalizeHttpUrl("HTTPS://MiXeD.CaSe.DomAin.Com");
		expect(r).toEqual({
			ok: true,
			value: "https://mixed.case.domain.com",
		});
	});

	it("rejects non-http(s) schemes", () => {
		const r = normalizeHttpUrl("ftp://example.com");
		expect(r).toEqual({
			ok: false,
			error: "Only http(s) allowed",
		});
	});

	it("rejects blank/whitespace", () => {
		const r = normalizeHttpUrl("   ");
		expect(r).toEqual({
			ok: false,
			error: "Invalid URL",
		});
	});

	it("rejects empty string", () => {
		const r = normalizeHttpUrl("");
		expect(r).toEqual({
			ok: false,
			error: "Invalid URL",
		});
	});

	it("rejects single-label hosts without a dot", () => {
		const r = normalizeHttpUrl("http://nice");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});

	it("allows localhost", () => {
		const r = normalizeHttpUrl("http://localhost:3000");
		expect(r).toEqual({
			ok: true,
			value: "http://localhost:3000",
		});
	});

	it("allows IPv4 literal", () => {
		const r = normalizeHttpUrl("http://192.168.0.10:8080");
		expect(r).toEqual({
			ok: true,
			value: "http://192.168.0.10:8080",
		});
	});



	it("rejects URLs with embedded credentials", () => {
		const r = normalizeHttpUrl("https://user:pass@example.com/some/path");
		expect(r).toEqual({
			ok: false,
			error: "URL must not have credentials",
		});
	});

	it("always yields trailing slash even if there was a path/query/hash", () => {
		const r = normalizeHttpUrl("https://example.com////foo////bar/?b=2#zzz");
		expect(r).toEqual({
			ok: true,
			value: "https://example.com/foo/bar?b=2",
		});
	});
});

describe("normalizeWsUrl", () => {
	it("defaults to wss when no scheme is given", () => {
		const r = normalizeWsUrl("Relay.Example.com");
		expect(r).toEqual({
			ok: true,
			value: "wss://relay.example.com",
		});
	});

	it("keeps ws and strips default :80", () => {
		const r = normalizeWsUrl("ws://relay.example.com:80");
		expect(r).toEqual({
			ok: true,
			value: "ws://relay.example.com",
		});
	});

	it("keeps wss and strips default :443", () => {
		const r = normalizeWsUrl("wss://relay.example.com:443/////");
		expect(r).toEqual({
			ok: true,
			value: "wss://relay.example.com",
		});
	});

	it("preserves non-default port on relay URLs", () => {
		const r = normalizeWsUrl("wss://relay.example.com:7443/");
		expect(r).toEqual({
			ok: true,
			value: "wss://relay.example.com:7443",
		});
	});

	it("rejects http(s) for relay", () => {
		const r = normalizeWsUrl("https://relay.example.com");
		expect(r).toEqual({
			ok: false,
			error: "Only ws(s) allowed",
		});
	});

	it("rejects bare single-label host", () => {
		const r = normalizeWsUrl("wss://nic/");
		expect(r).toEqual({
			ok: false,
			error: "Invalid/unsupported host",
		});
	});


});
