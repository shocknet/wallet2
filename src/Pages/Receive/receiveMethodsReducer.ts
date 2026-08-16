import type { Satoshi } from "@/lib/types/units";
import type { SourceView } from "@/State/scoped/backups/sources/selectors";
import {
	emptyPayloads,
	payloadForMethod,
	pickDefaultMethod,
	seedPayloads,
	type ReceiveMethodId,
	type SourceReceivePayloads,
} from "./helpers";

export type ReceiveInvoice = {
	bolt11: string;
	amount: Satoshi;
};

export type ReceiveMethodsState = {
	sourceId: string;
	payloads: SourceReceivePayloads;
	method: ReceiveMethodId | null;
	invoice: ReceiveInvoice | null;
	invoiceLoading: boolean;
};

export type ReceiveMethodsAction =
	| { type: "reset"; source: SourceView }
	| {
		type: "patch";
		sourceId: string;
		patch: Partial<SourceReceivePayloads>;
	}
	| { type: "selectMethod"; method: ReceiveMethodId }
	| { type: "invoiceStart" }
	| { type: "invoiceSuccess"; invoice: ReceiveInvoice }
	| { type: "invoiceError" };

const emptyStage: ReceiveMethodsState = {
	sourceId: "",
	payloads: emptyPayloads,
	method: null,
	invoice: null,
	invoiceLoading: false,
};

export function createInitialReceiveMethodsState(
	source: SourceView,
): ReceiveMethodsState {
	return receiveMethodsReducer(emptyStage, { type: "reset", source });
}

export function receiveMethodsReducer(
	state: ReceiveMethodsState,
	action: ReceiveMethodsAction,
): ReceiveMethodsState {
	switch (action.type) {
		case "reset": {
			const payloads = seedPayloads(action.source);
			return {
				sourceId: action.source.sourceId,
				payloads,
				method: pickDefaultMethod(payloads),
				invoice: null,
				invoiceLoading: false,
			};
		}
		case "patch": {
			if (action.sourceId !== state.sourceId) return state; // we switched away from this source; ignore the patch
			const payloads = { ...state.payloads, ...action.patch };
			return {
				...state,
				payloads,
				method: resolveMethod(state.method, payloads),
			};
		}
		case "selectMethod":
			return { ...state, method: action.method };
		case "invoiceStart":
			return {
				...state,
				method: "invoice",
				invoiceLoading: true,
			};
		case "invoiceSuccess":
			return {
				...state,
				method: "invoice",
				invoice: action.invoice,
				invoiceLoading: false,
			};
		case "invoiceError":
			return {
				...state,
				invoiceLoading: false,
				method: pickDefaultMethod(state.payloads),
			};
	}
}

/** Keep the user's pick when still valid; otherwise fall back to default. */
function resolveMethod(
	current: ReceiveMethodId | null,
	payloads: SourceReceivePayloads,
): ReceiveMethodId | null {
	if (current === "invoice") return "invoice";
	if (current !== null && payloadForMethod(current, payloads) !== null) {
		return current;
	}
	return pickDefaultMethod(payloads);
}
