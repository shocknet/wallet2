import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store/store";
import { PushRegistrationResult } from "@/notifications/push/types";
import { DeviceAuthCapability, type DeviceAuthStatus } from "@/lib/deviceAuth/types";
import type { NotificationsPermission } from "@/notifications/permission";



interface RuntimeState {
	nowMs: number;
	isActive: boolean;


	pushStatus: PushRegistrationResult | null;
	notificationsPermission: NotificationsPermission | null;

	deviceAuth: DeviceAuthStatus;


	selectedMetricsAdminSourceId: string | null;
}

const initialDeviceAuthStatus: DeviceAuthStatus = {
	checkedAtMs: null,
	capability: DeviceAuthCapability.NONE,
};

const initialState: RuntimeState = {
	nowMs: Date.now(),
	isActive: true,

	pushStatus: null,
	notificationsPermission: null,

	deviceAuth: initialDeviceAuthStatus,

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

		setPushRuntimeStatus: (
			state,
			action: PayloadAction<{
				pushStatus: PushRegistrationResult
			}>
		) => {
			state.pushStatus = action.payload.pushStatus
		},

		setNotificationsPermission: (
			state,
			action: PayloadAction<{ permission: NotificationsPermission }>
		) => {
			state.notificationsPermission = action.payload.permission;
		},

		setDeviceAuthStatus: (
			state,
			action: PayloadAction<{ deviceAuth: DeviceAuthStatus }>
		) => {
			state.deviceAuth = action.payload.deviceAuth;
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
export const selectDeviceAuthStatus = (s: RootState) => s.runtime.deviceAuth;
export const selectNotificationsPermission = (s: RootState) =>
	s.runtime.notificationsPermission;
export const selectPushStatus = (s: RootState) => s.runtime.pushStatus;
export const selectIsActive = (s: RootState) => s.runtime.isActive;

export const selectSelectedMetricsAdminSourceId = (s: RootState) =>
	s.runtime.selectedMetricsAdminSourceId;

export const runTimeReducer = runtimeSlice.reducer;

export const runtimeActions = runtimeSlice.actions;
