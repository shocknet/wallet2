import { describe, expect, it } from "vitest";
import { defaultMempool } from "@/constants";
import { feeHostLabel, resolveFeeUrl } from "./fees";

describe("resolveFeeUrl", () => {
	it("falls back to default mempool", () => {
		expect(resolveFeeUrl("")).toBe(defaultMempool);
		expect(resolveFeeUrl("   ")).toBe(defaultMempool);
	});

	it("appends the recommended endpoint on a site origin", () => {
		expect(resolveFeeUrl("https://mempool.space")).toBe("https://mempool.space/api/v1/fees/recommended");
	});

	it("keeps a full fees url", () => {
		expect(resolveFeeUrl("https://mempool.space/api/v1/fees/recommended")).toBe(
			"https://mempool.space/api/v1/fees/recommended"
		);
	});
});

describe("feeHostLabel", () => {
	it("returns the hostname", () => {
		expect(feeHostLabel("https://mempool.space/api/v1/fees/recommended")).toBe("mempool.space");
	});
});
