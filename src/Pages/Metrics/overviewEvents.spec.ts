import { describe, expect, it } from "vitest";
import { buildOverviewEvents, scidHeight, unixAtHeight } from "./overviewEvents";

function chanIdAt(height: number): string {
	return (BigInt(height) << 40n).toString();
}

const emptyGraphs = {
	chain_balance: [] as { x: number }[],
	channel_balance: [] as { x: number }[],
	external_balance: [] as { x: number }[],
};

const month = { from_unix: 1_000_000, to_unix: 1_000_000 + 30 * 86400 };
const graphs = {
	chain_balance: [{ x: 964000 }, { x: 965000 }],
	channel_balance: [{ x: 964000 }, { x: 965000 }],
	external_balance: [],
};

describe("scidHeight", () => {
	it("reads the funding block from a short channel id", () => {
		expect(scidHeight(chanIdAt(965000))).toBe(965000);
	});

	it("returns 0 for unset ids", () => {
		expect(scidHeight("0")).toBe(0);
		expect(scidHeight("")).toBe(0);
	});
});

describe("buildOverviewEvents", () => {
	it("does not list every live channel as opened", () => {
		const events = buildOverviewEvents(
			{
				...graphs,
				open_channels: [
					{ channel_id: chanIdAt(900000), label: "old" },
					{ channel_id: chanIdAt(964500), label: "new" },
				],
				closed_channels: [],
				root_ops: [],
			},
			month,
		);
		expect(events.map((e) => e.message)).toEqual(["Channel opened · new"]);
	});

	it("keeps a close when LND gave no close time but the close height is in the period", () => {
		const events = buildOverviewEvents(
			{
				...graphs,
				open_channels: [],
				closed_channels: [
					{ channel_id: chanIdAt(900000), close_tx_timestamp: 0, closed_height: 964800 },
				],
				root_ops: [],
			},
			month,
		);
		expect(events.some((e) => e.message.startsWith("Channel closed"))).toBe(true);
	});

	it("drops a close outside the period", () => {
		const events = buildOverviewEvents(
			{
				...graphs,
				open_channels: [],
				closed_channels: [
					{ channel_id: chanIdAt(800000), close_tx_timestamp: 100, closed_height: 800000 },
				],
				root_ops: [],
			},
			month,
		);
		expect(events).toEqual([]);
	});

	it("includes root credits already scoped to the period", () => {
		const events = buildOverviewEvents(
			{
				...emptyGraphs,
				open_channels: [],
				closed_channels: [],
				root_ops: [{ op_type: "CHAIN_OP", amount: 50_000, created_at_unix: 1_000_100, op_id: "addr:tx:0" }],
			},
			month,
		);
		expect(events[0].message).toContain("On-chain credit");
	});

	it("prefers an alias over a pubkey or channel id", () => {
		const events = buildOverviewEvents(
			{
				...graphs,
				open_channels: [
					{ channel_id: chanIdAt(964500), label: "LNBiG [Hub-3]" },
				],
				closed_channels: [],
				root_ops: [],
			},
			month,
		);
		expect(events[0].message).toBe("Channel opened · LNBiG [Hub-3]");
		expect(events[0].open?.label).toBe("LNBiG [Hub-3]");
	});

	it("does not show a raw pubkey as the peer name", () => {
		const pubkey = "02" + "ab".repeat(32);
		const events = buildOverviewEvents(
			{
				...graphs,
				open_channels: [
					{ channel_id: chanIdAt(964500), label: pubkey },
				],
				closed_channels: [],
				root_ops: [],
			},
			month,
		);
		expect(events[0].message).not.toContain(pubkey);
		expect(events[0].message).toContain("Channel opened");
	});

	it("dates an open from the current tip, not the end of the selected year", () => {
		const now = 1_700_000_000;
		const blocks = { min: 964000, max: 965000 };
		const unix = unixAtHeight(964500, blocks, now);
		expect(unix).toBe(now - 500 * 600);
		expect(unix).toBeLessThanOrEqual(now);
	});
});
