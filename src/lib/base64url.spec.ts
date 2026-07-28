import { describe, expect, it } from "vitest";
import { base64urlDecode, base64urlEncode } from "./base64url";

describe("base64url", () => {
	it("round-trips arbitrary bytes", () => {
		const bytes = new Uint8Array([0, 1, 2, 3, 127, 128, 254, 255]);
		const encoded = base64urlEncode(bytes);
		const decoded = base64urlDecode(encoded);

		expect(Array.from(decoded)).toEqual(Array.from(bytes));
	});

	it("produces url-safe output without padding", () => {
		const bytes = new Uint8Array([251, 255, 239]);
		const encoded = base64urlEncode(bytes);

		expect(encoded.includes("+")).toBe(false);
		expect(encoded.includes("/")).toBe(false);
		expect(encoded.includes("=")).toBe(false);
	});

	it("decodes unpadded url-safe strings", () => {
		expect(base64urlDecode("aGVsbG8_")).toEqual(new Uint8Array([104, 101, 108, 108, 111, 63]));
	});
});
