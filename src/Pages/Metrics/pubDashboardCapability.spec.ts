import { describe, expect, it } from "vitest";
import {
	isMissingDashboardRpcError,
	isProbeSilentFailure,
} from "./pubDashboardCapability";

describe("isMissingDashboardRpcError", () => {
	it("detects generated transport unknown rpc typo", () => {
		expect(isMissingDashboardRpcError("unkown rpcName")).toBe(true);
	});

	it("detects corrected unknown rpc spelling", () => {
		expect(isMissingDashboardRpcError("unknown rpcName")).toBe(true);
		expect(isMissingDashboardRpcError("unknown rpcName: GetUsersAdminInfo")).toBe(true);
	});

	it("detects not-implemented for new dashboard rpcs", () => {
		expect(isMissingDashboardRpcError("method: GetAssetsAndLiabilitiesV2 is not implemented")).toBe(true);
		expect(isMissingDashboardRpcError("method: GetUsersAdminInfo is not implemented")).toBe(true);
		expect(isMissingDashboardRpcError("method: GetUserOperationsFromAdmin is not implemented")).toBe(true);
	});

	it("ignores unrelated errors", () => {
		expect(isMissingDashboardRpcError("admin token invalid")).toBe(false);
		expect(isMissingDashboardRpcError("timeout")).toBe(false);
		expect(isMissingDashboardRpcError("method: Health is not implemented")).toBe(false);
	});
});

describe("isProbeSilentFailure", () => {
	it("detects wallet client timeout when Pub swallows unknown RPCs", () => {
		expect(isProbeSilentFailure("Request timed out")).toBe(true);
		expect(isProbeSilentFailure("nostr connection timeout")).toBe(true);
		expect(isProbeSilentFailure("invalid response")).toBe(true);
	});

	it("ignores auth and unrelated failures", () => {
		expect(isProbeSilentFailure("admin token invalid")).toBe(false);
		expect(isProbeSilentFailure("send failed")).toBe(false);
	});
});
