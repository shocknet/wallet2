import { describe, expect, it } from "vitest";
import { describeSendFailure, eventAlreadyPublished } from "./nostrSendError";

describe("describeSendFailure", () => {
	it("unwraps nostr-tools AggregateError publish timeouts", () => {
		expect(describeSendFailure(new AggregateError(
			[new Error("publish timed out"), "duplicate url"],
			"All promises were rejected",
		))).toBe("publish timed out");
	});

	it("keeps a real connect failure", () => {
		expect(describeSendFailure(new Error("All relays of this node are down")))
			.toBe("All relays of this node are down");
	});
});

describe("eventAlreadyPublished", () => {
	it("treats a missing publish ACK as already sent", () => {
		expect(eventAlreadyPublished("publish timed out")).toBe(true);
	});

	it("does not treat a closed socket as published", () => {
		expect(eventAlreadyPublished("All relays of this node are down")).toBe(false);
		expect(eventAlreadyPublished("send failed")).toBe(false);
	});
});
