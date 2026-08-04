import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type {
	ClinkRequestsState,
	PendingClinkRequest,
	PendingClinkSession,
} from "./types";

const initialState: ClinkRequestsState = {
	pendingClinkRequests: [],
	pendingClinkRequestSession: null,
};

export const clinkRequestsSlice = createSlice({
	name: "clinkRequests",
	initialState,
	reducers: {
		enqueuePendingClinkRequest(
			state,
			action: PayloadAction<PendingClinkRequest>,
		) {
			const next = action.payload;
			const alreadyQueued = state.pendingClinkRequests.some(
				(request) => request.request.request_id === next.request.request_id,
			);
			if (alreadyQueued) {
				return;
			}
			state.pendingClinkRequests.push(next);
		},

		removePendingClinkRequest(
			state,
			action: PayloadAction<{
				requestId: string;
			}>,
		) {
			const { requestId } = action.payload;
			state.pendingClinkRequests = state.pendingClinkRequests.filter(
				(request) => request.request.request_id !== requestId,
			);
		},
		claimPendingClinkRequestSession(
			state,
			action: PayloadAction<PendingClinkSession>,
		) {
			state.pendingClinkRequestSession = action.payload;
		},
		clearPendingClinkRequestSession(state) {
			state.pendingClinkRequestSession = null;
		},
	},
});

export const clinkRequestsActions = clinkRequestsSlice.actions;

export const clinkRequestsReducer = clinkRequestsSlice.reducer;
