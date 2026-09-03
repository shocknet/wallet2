import { describe, expect, it } from "vitest";
import { alignBalanceSeries, axisRange, xBounds } from "./balanceSeries";

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

	it("does not stretch a one-sat wiggle across the whole chart", () => {
		const range = axisRange([
			{ x: 1, y: 1_720_000 },
			{ x: 2, y: 1_720_080 },
		]);
		const shown = range.max - range.min;
		expect(shown).toBeGreaterThan(80_000);
		expect((1_720_080 - 1_720_000) / shown).toBeLessThan(0.01);
	});
});

describe("xBounds", () => {
	it("pins the x axis to the first and last sample", () => {
		expect(xBounds(
			[{ x: 964806, y: 1 }, { x: 965250, y: 1 }],
			[{ x: 964806, y: 10 }, { x: 965125, y: 50 }],
		)).toEqual({ min: 964806, max: 965250 });
	});
});
