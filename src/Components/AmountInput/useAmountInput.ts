import { validateAndFormatAmountInput } from "@/lib/format";
import { Satoshi } from "@/lib/types/units";
import { formatBitcoin, formatSatoshi, parseUserInputToSats, satsToBtc } from "@/lib/units";
import { useReducer, useMemo } from "react";




type AmountMode = "manual" | "max" | "fixed";

interface Limits {
	min: Satoshi;
	max: Satoshi;
}

interface State {
	mode: AmountMode;
	unit: "sats" | "BTC";
	limits?: Limits;
	manualText: string;
	fixedAmount?: Satoshi;
}

type Action =
	| { type: "TYPE_AMOUNT"; text: string }
	| { type: "PRESS_MAX" }
	| { type: "SET_FIXED"; sats: Satoshi }
	| { type: "CLEAR_FIXED" }
	| { type: "SET_LIMITS"; limits: Limits }
	| { type: "TOGGLE_UNIT" };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "TYPE_AMOUNT":
			return { ...state, mode: "manual", manualText: action.text };
		case "PRESS_MAX":
			return { ...state, mode: "max" };
		case "SET_FIXED":
			return { ...state, mode: "fixed", fixedAmount: action.sats };
		case "CLEAR_FIXED":
			return { ...state, mode: "manual", manualText: "", fixedAmount: undefined };
		case "SET_LIMITS":
			return { ...state, limits: action.limits };
		case "TOGGLE_UNIT": {
			const newUnit = state.unit === "BTC" ? "sats" : "BTC";

			if (state.mode === "manual" && state.manualText) {
				try {
					const sats = parseUserInputToSats(state.manualText, state.unit);
					const newText = newUnit === "BTC"
						? formatBitcoin(satsToBtc(sats))
						: formatSatoshi(sats);
					return { ...state, unit: newUnit, manualText: newText };
				} catch {
					// fallback – clear field
					return { ...state, unit: newUnit, manualText: "" };
				}
			}
			return { ...state, unit: newUnit };
		}
		default:
			return state;
	}
}

function satsToDisplay(sats: Satoshi, unit: "sats" | "BTC") {
	return unit === "BTC" ? formatBitcoin(satsToBtc(sats)) : formatSatoshi(sats);
}

interface UseAmountInputArgs {
	userBalance?: Satoshi;
}

export function useAmountInput({ userBalance }: UseAmountInputArgs) {
	const [state, dispatch] = useReducer(reducer, {
		mode: "manual" as AmountMode,
		unit: "sats",
		limits: userBalance !== undefined ? { min: 1 as Satoshi, max: userBalance } : undefined,
		manualText: "",
	});

	const effectiveSats: Satoshi | null = useMemo(() => {
		switch (state.mode) {
			case "fixed":
				return state.fixedAmount!;
			case "max":
				return state.limits?.max ?? null;
			case "manual":
				try {
					return parseUserInputToSats(state.manualText, state.unit);
				} catch {
					return null;
				}
		}
	}, [state]);

	const displayValue = useMemo(() => {
		switch (state.mode) {
			case "fixed":
				return satsToDisplay(state.fixedAmount!, state.unit);
			case "max":
				return state.limits !== undefined ? satsToDisplay(state.limits.max, state.unit) : "";
			case "manual":
				return state.manualText;
		}
	}, [state]);

	const error: string | undefined = useMemo(() => {
		if (!state.limits) return undefined;
		if (!effectiveSats) return undefined;
		console.log({ effectiveSats })
		if (effectiveSats < state.limits.min)
			return `Minimum amount is ${formatSatoshi(state.limits.min)}`;
		if (effectiveSats > state.limits.max)
			return `Maximum amount is ${formatSatoshi(state.limits.max)}`;
		return undefined;
	}, [effectiveSats, state.limits]);

	const actions = {
		typeAmount: (raw: string) => {
			const formattedValue = validateAndFormatAmountInput(raw, state.unit);
			dispatch({
				type: "TYPE_AMOUNT",
				text: formattedValue,
			})
			return formattedValue;
		}
		,
		pressMax: () => dispatch({ type: "PRESS_MAX" }),
		setFixed: (sats: Satoshi) => dispatch({ type: "SET_FIXED", sats }),
		clearFixed: () => dispatch({ type: "CLEAR_FIXED" }),
		setLimits: (limits: Limits) => dispatch({ type: "SET_LIMITS", limits }),
		toggleUnit: () => dispatch({ type: "TOGGLE_UNIT" }),
	} as const;

	const inputDisabled = state.mode === "fixed";

	return {
		displayValue,
		effectiveSats,
		unit: state.unit,
		limits: state.limits,
		error,
		inputDisabled,
		...actions,
	};
}
