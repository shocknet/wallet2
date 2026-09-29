import type { SourceView } from "@/State/scoped/backups/sources/selectors";
import { RECEIVE_TAB_ORDER, type ReceiveMethodId } from "./helpers";

export type ReceiveHave = {
	lnAddress?: string;
	chain?: string;
	noffer?: string;
};

export type ReceiveMethodsState = {
	have: ReceiveHave;
	selection: ReceiveMethodId;
};

export type ReceiveMethodsAction =
	| { type: "patch"; patch: Partial<ReceiveHave> }
	| { type: "selectMethod"; method: ReceiveMethodId };

export function createInitialReceiveMethodsState(
	source: SourceView,
): ReceiveMethodsState {
	const have: ReceiveHave = {
		lnAddress: source.vanityName?.trim() || undefined,
		noffer: source.noffer?.trim() || undefined,
	};

	return {
		have,
		selection: defaultSelection(have),
	};
}

export function receiveMethodsReducer(
	state: ReceiveMethodsState,
	action: ReceiveMethodsAction,
): ReceiveMethodsState {
	switch (action.type) {
		case "patch":
			return {
				...state,
				have: applyPatch(state.have, action.patch),
			};
		case "selectMethod": {
			const selection = selectionFor(action.method, state.have);
			if (!selection) return state;
			return { ...state, selection };
		}
	}
}

function applyPatch(
	have: ReceiveHave,
	patch: Partial<ReceiveHave>,
): ReceiveHave {
	const next: ReceiveHave = { ...have };
	if (patch.lnAddress) next.lnAddress = patch.lnAddress;
	if (patch.chain) next.chain = patch.chain;
	if (patch.noffer) next.noffer = patch.noffer;
	return next;
}

function selectionFor(
	method: ReceiveMethodId,
	have: ReceiveHave,
): ReceiveMethodId | null {
	switch (method) {
		case "invoice":
			return "invoice";
		case "ln-address":
			return have.lnAddress ? method : null;
		case "chain":
			return have.chain ? method : null;
		case "noffer":
			return have.noffer ? method : null;
	}
}

function defaultSelection(have: ReceiveHave): ReceiveMethodId {
	for (const method of RECEIVE_TAB_ORDER) {
		if (selectionFor(method, have)) return method;
	}
	return "invoice";
}
