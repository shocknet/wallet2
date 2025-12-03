import { describe, it, expect } from "vitest";
import { HttpBaseSchema, RelayBaseSchema } from "./urlZod";

describe("HttpBaseSchema", () => {
	it("turns example.com into https://example.com/ (default https, lowercase, trailing slash)", () => {
		const r = HttpBaseSchema.safeParse("Example.com/foo?bar");
		expect(r.success).toBe(true);
		if (r.success) {
			expect(r.data).toBe("https://example.com");
		}
	});

	it("strips :80 for http", () => {
		const r = HttpBaseSchema.safeParse("http://EXAMPLE.com:80/path?q=1#frag");
		expect(r.success).toBe(true);
		if (r.success) {
			expect(r.data).toBe("http://example.com");
		}
	});

	it("fails on single-label host with no dot", () => {
		const r = HttpBaseSchema.safeParse("http://nice");
		expect(r.success).toBe(false);
		if (!r.success) {
			// first error should come from ctx.issues.push(...)
			expect(r.error.issues[0].message).toMatch(/Not a valid http URL|Invalid/i);
		}
	});

	it("fails on empty string", () => {
		const r = HttpBaseSchema.safeParse("");
		expect(r.success).toBe(false);

	});
});

describe("RelayBaseSchema", () => {
	it("defaults to wss:// and appends trailing slash", () => {
		const r = RelayBaseSchema.safeParse("Relay.Example.com////foo");
		expect(r.success).toBe(true);
		if (r.success) {
			expect(r.data).toBe("wss://relay.example.com");
		}
	});

	it("preserves non-default port and still adds slash", () => {
		const r = RelayBaseSchema.safeParse("wss://relay.example.com:7443/////");
		expect(r.success).toBe(true);
		if (r.success) {
			expect(r.data).toBe("wss://relay.example.com:7443");
		}
	});

	it("rejects http(s) for relays", () => {
		const r = RelayBaseSchema.safeParse("https://relay.example.com");
		expect(r.success).toBe(false);
		if (!r.success) {
			expect(r.error.issues[0].message).toMatch(/relay/i);
		}
	});

	it("rejects localhost relays", () => {
		const r = RelayBaseSchema.safeParse("wss://localhost:7443");
		expect(r.success).toBe(false);
		if (!r.success) {
			expect(r.error.issues[0].message).toMatch(/relay/i);
		}
	});

	it("rejects IP relays", () => {
		const r = RelayBaseSchema.safeParse("ws://10.0.0.5:9001");
		expect(r.success).toBe(false);
		if (!r.success) {
			expect(r.error.issues[0].message).toMatch(/relay/i);
		}
	});
});
