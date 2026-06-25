import { AuthenticateOptions } from "@aparajita/capacitor-biometric-auth";

export enum DeviceAuthCapability {
	STRONG_BIOMETRY = "STRONG_BIOMETRY",
	DEVICE_CREDENTIAL = "DEVICE_CREDENTIAL",
	WEAK_BIOMETRY = "WEAK_BIOMETRY",
	NONE = "NONE",
}

export interface DeviceAuthStatus {
	checkedAtMs: number | null;
	capability: DeviceAuthCapability;
}

export type RequireDeviceAuthOptions = Omit<AuthenticateOptions,
	"allowDeviceCredential" |
	"androidConfirmationRequired" |
	"androidBiometryStrength"
>;
