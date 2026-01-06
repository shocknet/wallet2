import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store/store";



interface RuntimeState {
	nowMs: number;
	isActive: boolean;


	selectedMetricsAdminSourceId: string | null;
}

const initialState: RuntimeState = {
	nowMs: Date.now(),
	isActive: true,

	selectedMetricsAdminSourceId: null
}

const runtimeSlice = createSlice({
	name: "runtime",
	initialState,
	reducers: {
		clockTick(state, action: PayloadAction<{ nowMs: number }>) {
			state.nowMs = action.payload.nowMs;
		},


		/* lifecycle */
		setAppActiveStatus: (state, action: PayloadAction<{ active: boolean }>) => {
			state.isActive = action.payload.active;
		},

		/* metrics selection */
		setSelectedMetricsAdminSourceId: (state, action: PayloadAction<{ sourceId: string }>) => {
			state.selectedMetricsAdminSourceId = action.payload.sourceId;
		},
		clearSelectedMetricsAdminSourceId: (state) => {
			state.selectedMetricsAdminSourceId = null;
		},
	},
});

export const selectNowMs = (s: RootState) => s.runtime.nowMs;

export const selectSelectedMetricsAdminSourceId = (s: RootState) =>
	s.runtime.selectedMetricsAdminSourceId;

export const runTimeReducer = runtimeSlice.reducer;

export const runtimeActions = runtimeSlice.actions;




