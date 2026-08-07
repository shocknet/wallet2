import { describe, expect, it } from "vitest";
import type { Satoshi } from "@/lib/types/units";
import {
	amountFieldReducer,
	createInitialAmountFieldState,
	formatAmountInput,
	normalizeLimits,
	selectAmountFieldView,
} from "./model";

const sats = (n: number) => n as Satoshi;

describe("amountFieldReducer", () => {
	it("starts empty in manual sats mode", () => {
		const state = createInitialAmountFieldState();
		expect(state).toEqual({
			unit: "sats",
			limits: null,
			draft: { kind: "manual", text: "" },
		});
		expect(selectAmountFieldView(state).sats).toBeNull();
		expect(selectAmountFieldView(state).displayValue).toBe("");
	});

	it("seeds manual draft from initialSats", () => {
		const state = createInitialAmountFieldState({
			initialSats: sats(10),
		});
		expect(state.draft).toEqual({ kind: "manual", text: "10" });
		expect(selectAmountFieldView(state).sats).toBe(10);

		const btc = createInitialAmountFieldState({
			unit: "BTC",
			initialSats: sats(100_000_000),
		});
		expect(btc.draft).toEqual({ kind: "manual", text: "1.00000000" });
		expect(selectAmountFieldView(btc).sats).toBe(100_000_000);
	});

	it("accepts formatted manual input", () => {
		let state = createInitialAmountFieldState();
		state = amountFieldReducer(state, {
			type: "input",
			text: formatAmountInput("1000", "sats"),
		});
		const view = selectAmountFieldView(state);
		expect(state.draft).toEqual({ kind: "manual", text: "1,000" });
		expect(view.mode).toBe("manual");
		expect(view.sats).toBe(1000);
		expect(view.displayValue).toBe("1,000");
	});

	it("treats empty manual input as null sats (not zero)", () => {
		const view = selectAmountFieldView(createInitialAmountFieldState());
		expect(view.sats).toBeNull();
		expect(view.error).toBeUndefined();
	});

	it("enters max draft from limits", () => {
		let state = createInitialAmountFieldState({
			limits: { min: sats(1), max: sats(50_000) },
		});
		state = amountFieldReducer(state, { type: "max" });
		const view = selectAmountFieldView(state);
		expect(state.draft).toEqual({ kind: "max" });
		expect(view.mode).toBe("max");
		expect(view.sats).toBe(50_000);
		expect(view.isMaxSelected).toBe(true);
		expect(view.displayValue).toBe("50,000");
	});

	it("ignores max when there are no limits", () => {
		const state = createInitialAmountFieldState();
		expect(amountFieldReducer(state, { type: "max" })).toEqual(state);
	});

	it("clears draft back to empty manual", () => {
		let state = createInitialAmountFieldState({
			limits: { min: sats(1), max: sats(100) },
		});
		state = amountFieldReducer(state, { type: "max" });
		state = amountFieldReducer(state, { type: "clear" });
		expect(state.draft).toEqual({ kind: "manual", text: "" });
		expect(selectAmountFieldView(state).sats).toBeNull();
	});

	it("typing after max returns to manual", () => {
		let state = createInitialAmountFieldState({
			limits: { min: sats(1), max: sats(100) },
		});
		state = amountFieldReducer(state, { type: "max" });
		state = amountFieldReducer(state, {
			type: "input",
			text: formatAmountInput("50", "sats"),
		});
		expect(state.draft).toEqual({ kind: "manual", text: "50" });
		expect(selectAmountFieldView(state).sats).toBe(50);
	});

	it("toggles unit and converts manual text", () => {
		let state = createInitialAmountFieldState();
		state = amountFieldReducer(state, {
			type: "input",
			text: formatAmountInput("100000000", "sats"),
		});
		state = amountFieldReducer(state, { type: "toggleUnit" });
		expect(state.unit).toBe("BTC");
		expect(selectAmountFieldView(state).displayValue).toBe("1.00000000");
		expect(selectAmountFieldView(state).sats).toBe(100_000_000);

		state = amountFieldReducer(state, { type: "toggleUnit" });
		expect(state.unit).toBe("sats");
		expect(selectAmountFieldView(state).sats).toBe(100_000_000);
	});

	it("toggles unit in max draft without leaving max", () => {
		let state = createInitialAmountFieldState({
			limits: { min: sats(1), max: sats(100_000_000) },
		});
		state = amountFieldReducer(state, { type: "max" });
		state = amountFieldReducer(state, { type: "toggleUnit" });
		expect(state.draft.kind).toBe("max");
		expect(state.unit).toBe("BTC");
		expect(selectAmountFieldView(state).displayValue).toBe("1.00000000");
		expect(selectAmountFieldView(state).sats).toBe(100_000_000);
	});

	it("falls back from max to empty manual when limits are cleared", () => {
		let state = createInitialAmountFieldState({
			limits: { min: sats(1), max: sats(100) },
		});
		state = amountFieldReducer(state, { type: "max" });
		state = amountFieldReducer(state, { type: "setLimits", limits: null });
		expect(state.limits).toBeNull();
		expect(state.draft).toEqual({ kind: "manual", text: "" });
		expect(selectAmountFieldView(state).mode).toBe("manual");
		expect(selectAmountFieldView(state).sats).toBeNull();
	});

	it("keeps typed value when limits tighten but clears payable sats", () => {
		let state = createInitialAmountFieldState({
			limits: { min: sats(1), max: sats(100) },
		});
		state = amountFieldReducer(state, { type: "input", text: "50" });
		state = amountFieldReducer(state, {
			type: "setLimits",
			limits: { min: sats(10), max: sats(40) },
		});
		expect(state.draft).toEqual({ kind: "manual", text: "50" });
		const view = selectAmountFieldView(state);
		expect(view.parsedSats).toBe(50);
		expect(view.sats).toBeNull();
		expect(view.error).toMatch(/Maximum amount is 40/);
	});

	it("nulls payable sats when outside limits while keeping error + parsed", () => {
		let state = createInitialAmountFieldState({
			limits: { min: sats(1), max: sats(100) },
		});
		state = amountFieldReducer(state, {
			type: "input",
			text: formatAmountInput("0", "sats"),
		});
		expect(selectAmountFieldView(state).sats).toBeNull();

		state = amountFieldReducer(state, {
			type: "input",
			text: formatAmountInput("200", "sats"),
		});
		const view = selectAmountFieldView(state);
		expect(view.parsedSats).toBe(200);
		expect(view.sats).toBeNull();
		expect(view.error).toMatch(/Maximum amount is 100/);
	});

	it("drops inverted limits", () => {
		expect(
			normalizeLimits({ min: sats(100), max: sats(10) }),
		).toBeNull();
		const state = amountFieldReducer(createInitialAmountFieldState(), {
			type: "setLimits",
			limits: { min: sats(100), max: sats(10) },
		});
		expect(state.limits).toBeNull();
	});
});

describe("selectAmountFieldView with fixedSats prop", () => {
	it("fixedSats overrides draft and disables editing", () => {
		let state = createInitialAmountFieldState();
		state = amountFieldReducer(state, { type: "input", text: "12" });
		const view = selectAmountFieldView(state, sats(21_000));
		expect(view).toMatchObject({
			mode: "fixed",
			sats: 21_000,
			displayValue: "21,000",
			disabled: true,
		});
		// Draft underneath is untouched.
		expect(state.draft).toEqual({ kind: "manual", text: "12" });
	});

	it("clearing fixedSats reveals empty after unlock clears draft", () => {
		let state = createInitialAmountFieldState();
		state = amountFieldReducer(state, { type: "input", text: "12" });
		expect(selectAmountFieldView(state, sats(99)).mode).toBe("fixed");
		// Component clears draft on unlock; model itself preserves draft until clear.
		expect(selectAmountFieldView(state, null).sats).toBe(12);
		state = amountFieldReducer(state, { type: "clear" });
		expect(selectAmountFieldView(state, null).sats).toBeNull();
	});

	it("can still toggle unit while viewing a fixed amount", () => {
		let state = createInitialAmountFieldState();
		state = amountFieldReducer(state, { type: "toggleUnit" });
		const view = selectAmountFieldView(state, sats(100_000_000));
		expect(view.displayValue).toBe("1.00000000");
		expect(view.sats).toBe(100_000_000);
		expect(view.mode).toBe("fixed");
	});

	it("surfaces limit errors on fixed amounts over max and nulls sats", () => {
		const state = createInitialAmountFieldState({
			limits: { min: sats(1), max: sats(100) },
		});
		const view = selectAmountFieldView(state, sats(500));
		expect(view.error).toMatch(/Maximum amount is 100/);
		expect(view.parsedSats).toBe(500);
		expect(view.sats).toBeNull();
		expect(view.disabled).toBe(true);
	});
});
