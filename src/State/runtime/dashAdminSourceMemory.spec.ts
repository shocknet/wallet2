import { beforeEach, describe, expect, it } from "vitest";
import { runTimeReducer, runtimeActions } from "./slice";
import {
	activeAdminSourceId,
	forgetDashAdminSource,
	readRememberedDashAdminSource,
	rememberDashAdminSource,
	sessionSourceIdForIdentity,
} from "./dashAdminSourceMemory";

const pubkey = "dash-admin-memory-spec";

describe("activeAdminSourceId", () => {
	it("keeps the node already chosen this session", () => {
		expect(activeAdminSourceId(["a", "b"], "b", "a")).toBe("b");
	});

	it("opens the last node after a refresh", () => {
		expect(activeAdminSourceId(["a", "b"], null, "b")).toBe("b");
	});

	it("ignores a remembered node that is no longer an admin node", () => {
		expect(activeAdminSourceId(["a", "b"], null, "gone")).toBeNull();
	});

	it("skips a stale session choice and uses the remembered node", () => {
		expect(activeAdminSourceId(["a", "b"], "gone", "a")).toBe("a");
	});

	it("uses the only admin node when nothing else matches", () => {
		expect(activeAdminSourceId(["only"], null, "gone")).toBe("only");
	});
});

describe("sessionSourceIdForIdentity", () => {
	const alice = "identity-a";
	const bob = "identity-b";

	beforeEach(() => {
		forgetDashAdminSource(alice);
		forgetDashAdminSource(bob);
	});

	it("keeps a choice made for this identity", () => {
		const state = runTimeReducer(
			undefined,
			runtimeActions.setSelectedMetricsAdminSourceId({ identityPubkey: alice, sourceId: "x" }),
		);

		expect(sessionSourceIdForIdentity(state.metricsAdminSession, alice)).toBe("x");
	});

	it("ignores another identity's choice and leaves this identity's remembered source", () => {
		rememberDashAdminSource(bob, "y");
		const state = runTimeReducer(
			undefined,
			runtimeActions.setSelectedMetricsAdminSourceId({ identityPubkey: alice, sourceId: "x" }),
		);
		const selectedId = sessionSourceIdForIdentity(state.metricsAdminSession, bob);
		const activeId = activeAdminSourceId(
			["x", "y"],
			selectedId,
			readRememberedDashAdminSource(bob),
		);

		expect(activeId).toBe("y");
		if (activeId) rememberDashAdminSource(bob, activeId);

		expect(readRememberedDashAdminSource(bob)).toBe("y");
		expect(readRememberedDashAdminSource(alice)).toBeNull();
	});
});

describe("rememberDashAdminSource", () => {
	beforeEach(() => {
		forgetDashAdminSource(pubkey);
	});

	it("stores the node for that identity and can drop it", () => {
		rememberDashAdminSource(pubkey, "node-1");
		expect(readRememberedDashAdminSource(pubkey)).toBe("node-1");
		forgetDashAdminSource(pubkey);
		expect(readRememberedDashAdminSource(pubkey)).toBeNull();
	});
});
