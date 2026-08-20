import { InputClassification, ParsedInput } from "@/lib/types/parse";
import type { Satoshi } from "@/lib/types/units";

interface IdleState {
	status: "idle";
	inputValue: string;
}


interface LoadingState {
	status: "loading";
	inputValue: string;
	classification: InputClassification;
	// e.g. LNURL or LN_ADDRESS being fetched
}

interface ParsedOkState {
	status: "parsedOk";
	inputValue: string;
	parsedData: ParsedInput;
}

interface ErrorState {
	status: "error";
	inputValue: string;
	error: string;
	classification?: InputClassification;
}

// Recipient input states
export type RecipentParseState =
	| IdleState
	| LoadingState
	| ParsedOkState
	| ErrorState;

/** @deprecated Prefer RecipentParseState — kept for Sources / AddSource modal. */
export type InputState = RecipentParseState;

export type AmountRange = {
	min: Satoshi;
	max: Satoshi;
};

