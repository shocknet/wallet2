import { describe, expect, it } from "vitest";
import { sourceRpcKey } from "./selectors";

const source = {
	sourceId: "source-1",
	lpk: "ab".repeat(32),
	keys: {
		publicKey: "cd".repeat(32),
		privateKey: "ef".repeat(32),
	},
	relays: ["wss://relay.example"],
};

describe("sourceRpcKey", () => {
	it("stays stable when a source view is recreated without RPC changes", () => {
		expect(sourceRpcKey(source)).toBe(sourceRpcKey({ ...source }));
	});

	it("changes when the RPC destination changes", () => {
		expect(sourceRpcKey(source)).not.toBe(sourceRpcKey({
			...source,
			relays: ["wss://next-relay.example"],
		}));
	});
});
