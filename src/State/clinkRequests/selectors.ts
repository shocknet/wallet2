import { createSelector } from "@reduxjs/toolkit";
import { selectActiveIdentity } from "../identitiesRegistry/slice";
import { RootState } from "../store/store";


export const selectPendingClinkRequests = (
	state: RootState,
) => state.clinkRequests.pendingClinkRequests;

export const selectPendingClinkRequestsForActiveIdentity = createSelector(
	[
		selectActiveIdentity,
		selectPendingClinkRequests
	],
	(activeIdentity, pendingRequests) => {
		if (!activeIdentity) {
			return [];
		}
		return pendingRequests.filter(
			(request) => request.identityId === activeIdentity.pubkey,
		);
	}
)

export const selectPendingClinkRequestSession = (
	state: RootState,
) => state.clinkRequests.pendingClinkRequestSession;
