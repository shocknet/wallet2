import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { AppIntent } from "@/intents/types";
import type {
	MigrationFailure,
	PushIntent,
	RuntimeIdentity,
	ShellState,
	UnlockReason,
} from "./types";

const initialState: ShellState = {
	migration: {
		kind: "running",
	},
	startupIdentity: {
		kind: "resolving",
	},
	identitySession: {
		kind: "none",
	},
	pushIntent: null,
	pendingIntent: null,
};

export const shellSlice = createSlice({
	name: "shell",
	initialState,
	reducers: {
		migrationStarted(state) {
			state.migration = {
				kind: "running",
			};
		},

		migrationSucceeded(state) {
			state.migration = {
				kind: "succeeded",
			};
		},

		migrationFailed(
			state,
			action: PayloadAction<{
				failure: MigrationFailure;
			}>,
		) {
			state.migration = {
				kind: "failed",
				failure: action.payload.failure,
			};
		},

		startupIdentityResolved(state) {
			state.startupIdentity = {
				kind: "resolved",
			};
		},

		pushIntentSet(
			state,
			action: PayloadAction<PushIntent>,
		) {
			state.pushIntent = action.payload;
		},

		pushIntentCleared(state) {
			state.pushIntent = null;
		},

		identitySessionCleared(state) {
			state.identitySession = {
				kind: "none",
			};
		},

		identityUnlockRequested(
			state,
			action: PayloadAction<{
				identityId: string;
				reason: UnlockReason;
			}>,
		) {
			state.identitySession = {
				kind: "unlock-requested",
				identityId: action.payload.identityId,
				reason: action.payload.reason,
			};
		},

		sanctumReauthRequired(
			state,
			action: PayloadAction<{
				runtimeIdentity: RuntimeIdentity;
				reason?: string;
			}>,
		) {
			state.identitySession = {
				kind: "sanctum-reauth",
				runtimeIdentity: action.payload.runtimeIdentity,
				reason: action.payload.reason,
			};
		},

		identityLoadingStarted(
			state,
			action: PayloadAction<{
				identityId: string;
			}>,
		) {
			state.identitySession = {
				kind: "loading",
				identityId: action.payload.identityId,
			};
		},

		identityLoadFailed(
			state,
			action: PayloadAction<{
				identityId: string;
				message: string;
			}>,
		) {
			state.identitySession = {
				kind: "load-failed",
				identityId: action.payload.identityId,
				message: action.payload.message,
			};
		},

		pendingIntentSet(
			state,
			action: PayloadAction<AppIntent>,
		) {
			state.pendingIntent = action.payload;
		},

		pendingIntentCleared(
			state,
			action: PayloadAction<{ id: string }>,
		) {
			if (state.pendingIntent?.id === action.payload.id) {
				state.pendingIntent = null;
			}
		},
	},
});

export const shellActions = shellSlice.actions;

export const shellReducer = shellSlice.reducer;
