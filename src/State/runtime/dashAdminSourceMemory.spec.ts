import { beforeEach, describe, expect, it } from "vitest";
import {
	activeAdminSourceId,
	forgetDashAdminSource,
	readRememberedDashAdminSource,
	rememberDashAdminSource,
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
