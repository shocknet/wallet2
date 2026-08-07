import { validateAndFormatAmountInput } from "@/lib/format";
import type { AmountUnit, Satoshi } from "@/lib/types/units";
import {
	formatBitcoin,
	formatSatoshi,
	parseUserInputToSats,
	satsToBtc,
} from "@/lib/units";


export type AmountDraft =
	| { kind: "manual"; text: string }
	| { kind: "max" };

export type AmountMode = "manual" | "max" | "fixed";

export type AmountLimits = {
	min: Satoshi;
	max: Satoshi;
};

export type AmountFieldState = {
	unit: AmountUnit;
	limits: AmountLimits | null;
	draft: AmountDraft;
};

export type AmountFieldAction =
	| { type: "input"; text: string }
	| { type: "max" }
	| { type: "clear" }
	| { type: "setLimits"; limits: AmountLimits | null }
	| { type: "toggleUnit" };

export function createInitialAmountFieldState(
	options: {
		unit?: AmountUnit;
		limits?: AmountLimits | null;
		initialSats?: Satoshi | null;
	} = {},
): AmountFieldState {
	const unit = options.unit ?? "sats";
	const initialSats = options.initialSats ?? null;
	return {
		unit,
		limits: normalizeLimits(options.limits ?? null),
		draft:
			initialSats != null
				? { kind: "manual", text: satsToDisplay(initialSats, unit) }
				: { kind: "manual", text: "" },
	};
}

export function normalizeLimits(
	limits: AmountLimits | null,
): AmountLimits | null {
	if (!limits) {
		return null;
	}
	// Drop inverted ranges
	if (limits.min > limits.max) {
		return null;
	}
	return limits;
}

function satsToDisplay(sats: Satoshi, unit: AmountUnit): string {
	return unit === "BTC" ? formatBitcoin(satsToBtc(sats)) : formatSatoshi(sats);
}

function convertManualText(
	text: string,
	from: AmountUnit,
	to: AmountUnit,
): string {
	if (!text.trim()) {
		return "";
	}
	try {
		const sats = parseUserInputToSats(text, from);
		return satsToDisplay(sats, to);
	} catch {
		return "";
	}
}

export function amountFieldReducer(
	state: AmountFieldState,
	action: AmountFieldAction,
): AmountFieldState {
	switch (action.type) {
		case "input":
			return {
				...state,
				draft: { kind: "manual", text: action.text },
			};
		case "max": {
			if (!state.limits) {
				return state;
			}
			return {
				...state,
				draft: { kind: "max" },
			};
		}
		case "clear":
			return {
				...state,
				draft: { kind: "manual", text: "" },
			};
		case "setLimits": {
			const limits = normalizeLimits(action.limits);
			// Max is meaningless without limits — fall back to empty manual.
			if (!limits && state.draft.kind === "max") {
				return {
					...state,
					limits: null,
					draft: { kind: "manual", text: "" },
				};
			}
			return {
				...state,
				limits,
			};
		}
		case "toggleUnit": {
			const unit = state.unit === "BTC" ? "sats" : "BTC";
			if (state.draft.kind !== "manual") {
				return { ...state, unit };
			}
			return {
				...state,
				unit,
				draft: {
					kind: "manual",
					text: convertManualText(state.draft.text, state.unit, unit),
				},
			};
		}
		default:
			return state;
	}
}


export function formatAmountInput(raw: string, unit: AmountUnit): string {
	return validateAndFormatAmountInput(raw, unit);
}

export type AmountFieldView = {
	mode: AmountMode;
	sats: Satoshi | null;
	parsedSats: Satoshi | null; // raw parsed amount (may be out of range), used for fiat preview
	displayValue: string;
	error: string | undefined;
	isMaxSelected: boolean;
	disabled: boolean;
};

/*
 * Derive UI values. `fixedSats` from props wins over the editable draft.
 * `sats` is non-null only when the amount is fully valid.
 */
export function selectAmountFieldView(
	state: AmountFieldState,
	fixedSats: Satoshi | null = null,
): AmountFieldView {
	if (fixedSats != null) {
		const error = amountError(fixedSats, state.limits);
		return {
			mode: "fixed",
			parsedSats: fixedSats,
			sats: error ? null : fixedSats,
			displayValue: satsToDisplay(fixedSats, state.unit),
			error,
			isMaxSelected: false,
			disabled: true,
		};
	}

	const parsedSats = draftSats(state);
	const error = amountError(parsedSats, state.limits);
	const mode: AmountMode = state.draft.kind;

	return {
		mode,
		parsedSats,
		sats: error || parsedSats === null ? null : parsedSats,
		displayValue: draftDisplay(state),
		error,
		isMaxSelected: isMaxSelected(state, parsedSats),
		disabled: false,
	};
}

function draftSats(state: AmountFieldState): Satoshi | null {
	switch (state.draft.kind) {
		case "max":
			return state.limits?.max ?? null;
		case "manual": {
			if (!state.draft.text.trim()) {
				return null;
			}
			try {
				return parseUserInputToSats(state.draft.text, state.unit);
			} catch {
				return null;
			}
		}
	}
}

function draftDisplay(state: AmountFieldState): string {
	switch (state.draft.kind) {
		case "max":
			return state.limits
				? satsToDisplay(state.limits.max, state.unit)
				: "";
		case "manual":
			return state.draft.text;
	}
}

function amountError(
	sats: Satoshi | null,
	limits: AmountLimits | null,
): string | undefined {
	if (sats === null || !limits) {
		return undefined;
	}
	if (sats < limits.min) {
		return `Minimum amount is ${formatSatoshi(limits.min)} sats`;
	}
	if (sats > limits.max) {
		return `Maximum amount is ${formatSatoshi(limits.max)} sats`;
	}
	return undefined;
}

function isMaxSelected(
	state: AmountFieldState,
	sats: Satoshi | null,
): boolean {
	if (state.draft.kind === "max") {
		return true;
	}
	if (!state.limits || sats === null) {
		return false;
	}
	return sats === state.limits.max;
}
