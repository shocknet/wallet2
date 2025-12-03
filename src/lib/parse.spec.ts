import { describe, it, expect } from "vitest";
import { identifyBitcoinInput } from "@/lib/parse";
import { InputClassification } from "@/lib/types/parse";

describe("identifyBitcoinInput function", () => {
	describe("LN_INVOICE", () => {
		it("LN_INVOICE: returns lowercased payload, no scheme", () => {
			const inv = "lnbc4u1p5w8ap2pp5rkd7z4csjjezjdmgtw93q5ec7es9dzzadtdu9dv5prs77tymspkqdz9tddjyar90p6z7urvv95kug3vyq3ycnj42fxzqanfvysyc6t8dp6xu6twvuh8qatzyfw46cqzzsxqrrsssp5m8qmawwx4ry79rapsdl502m3lp46syc0pqtzy0eqfxcd9m69p3uq9qxpqysgqusfw8s507ngyphyfcha26sm9yu6vwz3fqu24dmhdwh62249g9uhhuhkdkrv84y0eldzteqlpgmudgsx5gqj2lj2s2fhevexdgz2r3mgq6as625"
			const res = identifyBitcoinInput("LIGHTNING:" + inv);
			expect(res.classification).toBe(InputClassification.LN_INVOICE);
			expect(res.value).toBe(inv);
		});
		it("LN_INVOICE: takes upper case, returns lowercased payload, no scheme", () => {
			const inv = "lnbc1" + "q".repeat(10);
			const res = identifyBitcoinInput("LIGHTNING:" + inv.toUpperCase());
			expect(res.classification).toBe(InputClassification.LN_INVOICE);
			expect(res.value).toBe(inv);
		});

		it("LN_INVOICE: mixed case scheme, returns lowercased payload, no scheme", () => {
			const inv = "lnbc1" + "q".repeat(10);
			const res = identifyBitcoinInput("LIgHtNiNG:" + inv.toUpperCase());
			expect(res.classification).toBe(InputClassification.LN_INVOICE);
			expect(res.value).toBe(inv);
		});
	})


	it("LNURL: lowercased payload, no scheme", () => {
		const lnurl = "lnurl1" + "p".repeat(12);
		const res = identifyBitcoinInput("LightNing:" + lnurl);
		expect(res.classification).toBe(InputClassification.LNURL_PAY);
		expect(res.value).toBe(lnurl);
	});

	it("NOFFER: lowercased payload, no scheme", () => {
		const nof = "noffer1" + "x".repeat(16);
		const res = identifyBitcoinInput("LIGHTNING:" + nof);
		expect(res.classification).toBe(InputClassification.NOFFER);
		expect(res.value).toBe(nof);
	});

	it("NPROFILE: lowercased nprofile with token, returned with token", () => {
		const np = "nprofile1" + "s".repeat(20);
		const token = "Admin.Token-42";
		const res = identifyBitcoinInput("NoStR:" + np + ":" + token);
		console.log(res)
		expect(res.classification).toBe(InputClassification.NPROFILE);
		expect(res.value).toBe(np + ":" + token);
	});

	it("LN_ADDRESS: preserves original casing of local-part and domain (no scheme)", () => {
		const addr = "Alice+Zap_123@example.cos";
		const res = identifyBitcoinInput("lightning:" + addr);
		expect(res.classification).toBe(InputClassification.LN_ADDRESS);
		expect(res.value).toBe(addr.toLowerCase());
	});

	it("BTC segwit: lowercased payload, no scheme", () => {
		const seg = "bc1p" + "q".repeat(12);
		const res = identifyBitcoinInput("BITCOIN:" + seg);
		expect(res.classification).toBe(InputClassification.BITCOIN_ADDRESS);
		expect(res.value).toBe(seg);
	});

	it("BTC base58: preserves original case, no scheme", () => {
		const base58 = "1BoatSLRHtKNngkdXEeobR76b53LETtpyT";
		const res = identifyBitcoinInput("Bitcoin:" + base58);
		expect(res.classification).toBe(InputClassification.BITCOIN_ADDRESS);
		expect(res.value).toBe(base58);
	});

	it("honors denylist (disallow LN_INVOICE)", () => {
		const inv = "lnbc1" + "q".repeat(10);
		const res = identifyBitcoinInput(inv, { disallowed: [InputClassification.LN_INVOICE] });
		expect(res.classification).toBe(InputClassification.UNKNOWN);
	});

	it("honors allowlist (allow only LN_INVOICE)", () => {
		const lnurl = "lnurl1" + "p".repeat(12);
		const res = identifyBitcoinInput(lnurl, { allowed: [InputClassification.LN_INVOICE] });
		expect(res.classification).toBe(InputClassification.UNKNOWN);
	});

	it("UNKNOWN for empty/whitespace", () => {
		expect(identifyBitcoinInput("   ").classification).toBe(InputClassification.UNKNOWN);
	});

	it("rejects Lightning Address with invalid domain underscore", () => {
		const res = identifyBitcoinInput("lightning:foo@exa_mple.com");
		expect(res.classification).toBe(InputClassification.UNKNOWN);
	});
});
