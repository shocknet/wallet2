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


		const p = client.NewInvoice({ amountSats: 70, memo: "test" });

		await Promise.resolve(); // tick so fake relaysCluster pushes to frames


		expect(ctl.frames).toHaveLength(1);
		expect(ctl.frames[0].to).toBe("pubdst-1");
		expect(ctl.frames[0].keys.publicKey).toBe("lpk-1");


		ctl.replyLastOk({ invoice: "lnbcmock69" });

		const res: any = await p;
		expect(res.status).toBe("OK");
		expect(res.invoice).toBe("lnbcmock69");
	});
});
