import { describe, expect, it } from "vitest";
import { PublishTimeout } from "./AbstractRelay";
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
	it("treats a PublishTimeout anywhere in the aggregate as already sent", () => {
		expect(eventAlreadyPublished(new AggregateError([
			new Error("All relays of this node are down"),
			new PublishTimeout(),
		]))).toBe(true);
	});

	it("does not treat other failures as published", () => {
		expect(eventAlreadyPublished(new Error("All relays of this node are down"))).toBe(false);
		expect(eventAlreadyPublished(new AggregateError([
			"duplicate url",
			new Error("send failed"),
		]))).toBe(false);
	});
});

