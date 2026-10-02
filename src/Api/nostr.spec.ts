import { mockNostrLayer } from "@tests/support/mockNostrLayer";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("getNostrClient", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.useFakeTimers();
	});

	it("Sends a request and resolves on onEvent", async () => {
		const ctl = mockNostrLayer();
		const { getNostrClient } = await import("@/Api/nostr");

		const client = await getNostrClient(
			{ pubkey: "pubdst-1", relays: ["wss://r1"] },
			{ publicKey: "lpk-1", privateKey: "sk" }
		);

		const pending = client.NewInvoice({ amountSats: 70, memo: "test" });
		const frame = await ctl.sent();

		expect(frame).toMatchObject({
			to: "pubdst-1",
			relays: ["wss://r1"],
			keys: { publicKey: "lpk-1" },
			rpcName: "NewInvoice",
			body: { amountSats: 70, memo: "test" },
		});

		ctl.replyOk(frame, { invoice: "lnbcmock69" });

		await expect(pending).resolves.toMatchObject({
			status: "OK",
			invoice: "lnbcmock69",
		});
	});
});
