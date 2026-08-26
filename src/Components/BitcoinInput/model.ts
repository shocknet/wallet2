import {
	InputClassification,
	type ParsedInput,
} from "@/lib/types/parse";

export const IDLE_STATE: BitcoinInputState = { status: "idle", value: "" };

export type BitcoinInputState =
	| { status: "idle"; value: string }
	| { status: "typing"; value: string }
	| {
		status: "loading";
		value: string;
		classification: InputClassification;
	}
	| { status: "ok"; value: string; parsed: ParsedInput }
	| {
		status: "error";
		value: string;
		error: string;
		classification?: InputClassification;
	};

export type BitcoinInputAction =
	| { type: "input"; value: string }
	| { type: "clear" }
	| {
		type: "parseLoading";
		value: string;
		classification: InputClassification;
	}
	| { type: "parseOk"; value: string; parsed: ParsedInput }
	| {
		type: "parseError";
		value: string;
		error: string;
		classification?: InputClassification;
	};

export function displayValueForParsed(parsed: ParsedInput): string {
	if (
		parsed.type === InputClassification.NPROFILE &&
		parsed.adminEnrollToken
	) {
		return `${parsed.data}:${parsed.adminEnrollToken}`;
	}
	return parsed.data;
}

export function createInitialBitcoinInputState(initial?: {
	value?: string;
	parsed?: ParsedInput | null;
}): BitcoinInputState {
	if (initial?.parsed) {
		return {
			status: "ok",
			value: initial.value ?? displayValueForParsed(initial.parsed),
			parsed: initial.parsed,
		};
	}
	const value = initial?.value ?? "";
	if (value.trim()) {
		return { status: "typing", value };
	}
	return { status: "idle", value };
}

export function bitcoinInputReducer(
	_state: BitcoinInputState,
	action: BitcoinInputAction,
): BitcoinInputState {
	switch (action.type) {
		case "input": {
			if (!action.value.trim()) {
				return { status: "idle", value: action.value };
			}
			return { status: "typing", value: action.value };
		}
		case "clear":
			return { status: "idle", value: "" };
		case "parseLoading":
			return {
				status: "loading",
				value: action.value,
				classification: action.classification,
			};
		case "parseOk":
			return {
				status: "ok",
				value: action.value,
				parsed: action.parsed,
			};
		case "parseError":
			return action.classification
				? {
					status: "error",
					value: action.value,
					error: action.error,
					classification: action.classification,
				}
				: {
					status: "error",
					value: action.value,
					error: action.error,
				};
	}
}
