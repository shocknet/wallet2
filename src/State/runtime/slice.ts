import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store/store";
import { PushRegistrationResult } from "@/notifications/push/types";
import { DeviceAuthCapability, type DeviceAuthStatus } from "@/lib/deviceAuth/types";
import type { DashAdminSessionSelection } from "./dashAdminSourceMemory";

interface RuntimeState {
	isActive: boolean;
	pushStatus: PushRegistrationResult | null;
	deviceAuth: DeviceAuthStatus;
	metricsAdminSession: DashAdminSessionSelection | null;
}

const initialDeviceAuthStatus: DeviceAuthStatus = {
	checkedAtMs: null,
	capability: DeviceAuthCapability.NONE,
};

const initialState: RuntimeState = {
	isActive: true,
	pushStatus: null,


	metricsAdminSession: null,
	deviceAuth: initialDeviceAuthStatus
}

const runtimeSlice = createSlice({
	name: "runtime",
	initialState,
	reducers: {
		/* lifecycle */
		setAppActiveStatus: (state, action: PayloadAction<{ active: boolean }>) => {
			state.isActive = action.payload.active;
		},
		setPushRuntimeStatus: (
			state,
			action: PayloadAction<{
				pushStatus: PushRegistrationResult
			}>
		) => {
			state.pushStatus = action.payload.pushStatus
		},
		setDeviceAuthStatus: (
			state,
			action: PayloadAction<{ deviceAuth: DeviceAuthStatus }>
		) => {
			state.deviceAuth = action.payload.deviceAuth;
		},
		/* metrics selection */
		setSelectedMetricsAdminSourceId: (state, action: PayloadAction<DashAdminSessionSelection>) => {
			state.metricsAdminSession = action.payload;
		},
		clearSelectedMetricsAdminSourceId: (state) => {
			state.metricsAdminSession = null;
		},
	},
});

export const selectDeviceAuthStatus = (s: RootState) => s.runtime.deviceAuth;
export const selectPushStatus = (s: RootState) => s.runtime.pushStatus;
export const selectIsActive = (s: RootState) => s.runtime.isActive;

export const selectMetricsAdminSession = (s: RootState) =>
	s.runtime.metricsAdminSession;

export const runTimeReducer = runtimeSlice.reducer;

export const runtimeActions = runtimeSlice.actions;
