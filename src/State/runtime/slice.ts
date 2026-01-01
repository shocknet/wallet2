import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store/store";



interface RuntimeState {
	nowMs: number;
	isActive: boolean;
}

const initialState: RuntimeState = {
	nowMs: Date.now(),
	isActive: true
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
	},
});

export const selectNowMs = (s: RootState) => s.runtime.nowMs;

export const runTimeReducer = runtimeSlice.reducer;

export const runtimeActions = runtimeSlice.actions;




