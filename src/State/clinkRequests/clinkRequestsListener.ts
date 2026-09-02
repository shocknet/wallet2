import { isAnyOf, ListenerEffectAPI } from "@reduxjs/toolkit";
import { listenerKick } from "@/State/listeners/actions";
import { sourceJustDeleted } from "@/State/listeners/predicates";
import type { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { selectSourceViewById } from "@/State/scoped/backups/sources/selectors";
import type { AppDispatch, RootState } from "@/State/store/store";
import { clinkRequestsActions } from "@/State/clinkRequests/slice";
import { selectPendingClinkRequestSession, selectPendingClinkRequestsForActiveIdentity } from "./selectors";

export const RECONCILE_DELAY_MS = 15;





function pruneOrphanedAClinkRequests(
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>
): void {
	const state = listenerApi.getState();
	const requestsForIdentity = selectPendingClinkRequestsForActiveIdentity(state);

	for (const request of requestsForIdentity) {
		const source = selectSourceViewById(state, request.sourceId);

		// remove request if its matching source has been deleted
		if (!source) {
			listenerApi.dispatch(clinkRequestsActions.removePendingClinkRequest({
				requestId: request.request.request_id,
			}));

			// clear session if it was the request that was removed
			if (selectPendingClinkRequestSession(state)?.request.request_id === request.request.request_id) {
				listenerApi.dispatch(clinkRequestsActions.clearPendingClinkRequestSession());
			}
		}
	}
}


function reconcilePendingClinkRequest(
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
): void {
	pruneOrphanedAClinkRequests(listenerApi);

	const state = listenerApi.getState();
	const session = selectPendingClinkRequestSession(state);

	if (session) return;

	const requests = selectPendingClinkRequestsForActiveIdentity(state);

	// Prefer debits, then manages; skip entries whose source is gone
	const ordered = [
		...requests.filter((request) => request.kind === "debit"),
		...requests.filter((request) => request.kind === "manage"),
	];

	for (const next of ordered) {
		const source = selectSourceViewById(state, next.sourceId);
		if (!source) continue;

		if (next.kind === "debit") {
			listenerApi.dispatch(clinkRequestsActions.claimPendingClinkRequestSession({
				kind: "debit",
				request: next.request,
				source,
			}));
			return;
		}

		listenerApi.dispatch(clinkRequestsActions.claimPendingClinkRequestSession({
			kind: "manage",
			request: next.request,
			source,
		}));
		return;
	}
}



export const pendingClinkRequestsListenerSpec: ListenerSpec = {
	name: "pendingAuthRequests",
	beforeUnload: ({ dispatch }) => {
		dispatch(clinkRequestsActions.clearPendingClinkRequestSession());
	},
	listeners: [
		(add) =>
			add({
				predicate: (action, curr, prev) => (
					isAnyOf(
						clinkRequestsActions.enqueuePendingClinkRequest,
						clinkRequestsActions.clearPendingClinkRequestSession,
						listenerKick,
					)(action)
					||
					sourceJustDeleted(action, curr, prev)
				),
				effect: async (_, listenerApi) => {
					listenerApi.cancelActiveListeners();
					await listenerApi.delay(RECONCILE_DELAY_MS);

					reconcilePendingClinkRequest(listenerApi);
				},
			}),
	],
};
