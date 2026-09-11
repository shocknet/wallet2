import { describe, expect, it } from "vitest";
import { InputClassification } from "@/lib/types/parse";
import type { ParsedLnurlWithdrawInput, ParsedNprofileInput } from "@/lib/types/parse";
import {
	addSourceQueryExtras,
	intentFromParsed,
	parseAbsoluteUrl,
	parseAppIntentInput,
	pathAfterAppHost,
} from "./resolve";

describe("parseAbsoluteUrl", () => {
	it("parses an absolute wallet URL", () => {
		const url = parseAbsoluteUrl("https://my.shockwallet.app/?addSource=nprofile1abc");
		expect(url?.searchParams.get("addSource")).toBe("nprofile1abc");
	});

	it("rejects slugs and bare query strings", () => {
		expect(parseAbsoluteUrl("/?addSource=nprofile1abc")).toBeNull();
		expect(parseAbsoluteUrl("?addSource=nprofile1abc")).toBeNull();
		expect(parseAbsoluteUrl("/home")).toBeNull();
	});
});

describe("intentFromParsed", () => {
	it("maps lnurl-w to sweep", () => {
		const parsed = {
			type: InputClassification.LNURL_WITHDRAW,
			data: "lnurl1",
		} as ParsedLnurlWithdrawInput;
		expect(intentFromParsed(parsed)).toEqual({ kind: "sweep", parsed });
	});

	it("maps nprofile to add-source without invite copy", () => {
		const parsed = {
			type: InputClassification.NPROFILE,
			data: "nprofile1",
			pubkey: "pk",
			relays: ["wss://relay.example"],
		} as ParsedNprofileInput;
		expect(intentFromParsed(parsed)).toEqual({ kind: "add-source", nprofile: parsed });
	});

	it("maps invoices to send", () => {
		const parsed = {
			type: InputClassification.LN_INVOICE,
			data: "lnbc1",
			amount: 1,
		};
		expect(intentFromParsed(parsed as never)).toEqual({ kind: "send", parsed });
	});

	it("does not map bitcoin addresses to an intent", () => {
		expect(
			intentFromParsed({
				type: InputClassification.BITCOIN_ADDRESS,
				data: "bc1q",
			}),
		).toBeNull();
	});
});

describe("parseAppIntentInput", () => {
	it("throws for unknown text", async () => {
		await expect(parseAppIntentInput("hello world")).rejects.toThrow("Unknown input");
	});

	it("throws for an identified type that is not an app intent", async () => {
		await expect(
			parseAppIntentInput("1BoatSLRHtKNngkdXEeobR76b53LETtpyT"),
		).rejects.toThrow("Bitcoin address is not usable");
	});
});

function nprofile(over: Partial<ParsedNprofileInput> = {}): ParsedNprofileInput {
	return {
		type: InputClassification.NPROFILE,
		data: "nprofile1",
		pubkey: "pk",
		relays: ["wss://relay.example"],
		...over,
	};
}

describe("addSourceQueryExtras", () => {
	it("ignores invite and link extras when the nprofile has an admin enroll token", () => {
		const params = new URLSearchParams({
			token: "tok",
			lnAddress: "a@b.com",
			inviteToken: "invite",
		});
		expect(addSourceQueryExtras(nprofile({ adminEnrollToken: "admin" }), params)).toEqual({});
	});

	it("takes integration extras when both token and lnAddress are present", () => {
		const params = new URLSearchParams({
			token: "tok",
			lnAddress: "a@b.com",
			inviteToken: "invite",
		});
		expect(addSourceQueryExtras(nprofile(), params)).toEqual({
			integrationData: { token: "tok", lnAddress: "a@b.com" },
		});
	});

	it("takes inviteToken when there is no integration pair", () => {
		expect(
			addSourceQueryExtras(nprofile(), new URLSearchParams({ inviteToken: "invite" })),
		).toEqual({ invitationToken: "invite" });
	});
});

describe("pathAfterAppHost", () => {
	it("forwards the path after an associated-domain host", () => {
		expect(pathAfterAppHost("https://my.shockwallet.app/send")).toBe("/send");
		expect(pathAfterAppHost("https://my.shockwallet.app/sources?x=1")).toBe("/sources?x=1");
	});

	it("does not treat a bare host or a non-app URL as a path", () => {
		expect(pathAfterAppHost("https://my.shockwallet.app")).toBeNull();
		expect(pathAfterAppHost("https://my.shockwallet.app/")).toBeNull();
		expect(pathAfterAppHost("lightning:lnbc1")).toBeNull();
		expect(pathAfterAppHost("bitcoin:bc1q")).toBeNull();
		expect(pathAfterAppHost("lnurl1abc")).toBeNull();
	});
});
