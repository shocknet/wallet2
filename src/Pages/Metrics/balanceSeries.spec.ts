import { describe, expect, it } from "vitest";
import { alignBalanceSeries, axisRange, fillBlockGaps, pairAxisRanges } from "./balanceSeries";

describe("alignBalanceSeries", () => {
	it("does not apply a later balance to an earlier block", () => {
		const aligned = alignBalanceSeries(
			[
				{ x: 100, y: 1 },
				{ x: 200, y: 1 },
			],
			[
				{ x: 100, y: 10 },
				{ x: 150, y: 50 },
				{ x: 200, y: 50 },
			],
		);
		expect(aligned.chans.find((p) => p.x === 100)?.y).toBe(10);
		expect(aligned.chans.find((p) => p.x === 150)?.y).toBe(50);
		expect(aligned.chans.find((p) => p.x === 200)?.y).toBe(50);
	});

	it("carries a held chain balance across denser channel samples", () => {
		const aligned = alignBalanceSeries(
			[
				{ x: 100, y: 50 },
				{ x: 130, y: 50 },
			],
			[
				{ x: 100, y: 10 },
				{ x: 110, y: 12 },
				{ x: 130, y: 11 },
			],
		);
		expect(aligned.chain).toEqual([
			{ x: 100, y: 50 },
			{ x: 110, y: 50 },
			{ x: 130, y: 50 },
		]);
		expect(aligned.chans).toHaveLength(3);
	});
});

describe("axisRange", () => {
	it("fits a real move so the step is most of the pane", () => {
		const range = axisRange([
			{ x: 1, y: 1_574_449 },
			{ x: 2, y: 1_724_449 },
		]);
		const shown = range.max - range.min;
		expect((1_724_449 - 1_574_449) / shown).toBeGreaterThan(0.5);
		expect(range.min).toBeLessThan(1_574_449);
		expect(range.max).toBeGreaterThan(1_724_449);
	});

	it("pads a flat series so it is not glued to the edge", () => {
		const range = axisRange([
			{ x: 1, y: 100_000 },
			{ x: 2, y: 100_000 },
		]);
		expect(range).toEqual({ min: 80_000, max: 120_000 });
	});

	it("makes a few-hundred-sat channel move visible", () => {
		const range = axisRange([
			{ x: 1, y: 1_693_278 },
			{ x: 2, y: 1_693_646 },
		]);
		const shown = range.max - range.min;
		expect((1_693_646 - 1_693_278) / shown).toBeGreaterThan(0.15);
	});
});

describe("pairAxisRanges", () => {
	it("puts two quiet series on different heights so they do not overlap", () => {
		const chain = [{ x: 1, y: 100_000 }, { x: 2, y: 100_000 }]
		const chans = [{ x: 1, y: 500_000 }, { x: 2, y: 500_000 }]
		const ranges = pairAxisRanges(chain, chans)
		const chainAt = (100_000 - ranges.chain.min) / (ranges.chain.max - ranges.chain.min)
		const chansAt = (500_000 - ranges.chans.min) / (ranges.chans.max - ranges.chans.min)
		expect(chainAt).toBeLessThan(0.45)
		expect(chansAt).toBeGreaterThan(0.55)
	});
});

describe("fillBlockGaps", () => {
	it("holds the last balance across missing blocks", () => {
		expect(fillBlockGaps([
			{ x: 965852, y: 100 },
			{ x: 965855, y: 140 },
		])).toEqual([
			{ x: 965852, y: 100 },
			{ x: 965853, y: 100 },
			{ x: 965854, y: 100 },
			{ x: 965855, y: 140 },
		]);
	});

	it("leaves a huge span alone so all-time does not explode", () => {
		expect(fillBlockGaps([
			{ x: 100, y: 1 },
			{ x: 10_000, y: 2 },
		])).toEqual([
			{ x: 100, y: 1 },
			{ x: 10_000, y: 2 },
		]);
	});
});
