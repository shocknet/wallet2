import { describe, expect, it } from "vitest";
import { parsePeerInput, parsePeerUri } from "./parsePeerUri";

describe("parsePeerUri", () => {
	it("parses pubkey@host:port", () => {
		const parsed = parsePeerUri("02abc@1.2.3.4:9735");
		expect(parsed).toEqual({ pubkey: "02abc", host: "1.2.3.4", port: 9735 });
	});

	it("parses ipv6", () => {
		const parsed = parsePeerUri("02abc@[::1]:9735");
		expect(parsed).toEqual({ pubkey: "02abc", host: "::1", port: 9735 });
	});

	it("parses pubkey only", () => {
		expect(parsePeerInput("02abc")).toEqual({ pubkey: "02abc" });
	});

	it("rejects missing port on a uri", () => {
		expect(parsePeerUri("02abc@1.2.3.4")).toEqual({ error: "Use pubkey@host:port" });
	});
});
