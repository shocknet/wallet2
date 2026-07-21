import { BiometricAuth, type CheckBiometryResult } from "@aparajita/capacitor-biometric-auth";
import { Capacitor } from "@capacitor/core";
import { DeviceAuthCapability, type DeviceAuthStatus } from "./types";

export function getDeviceAuthCapability(info: CheckBiometryResult): DeviceAuthCapability {
	if (info.strongBiometryIsAvailable) {
		return DeviceAuthCapability.STRONG_BIOMETRY;
	}
	if (info.isAvailable) {
		return DeviceAuthCapability.WEAK_BIOMETRY;
	}
	if (info.deviceIsSecure) {
		return DeviceAuthCapability.DEVICE_CREDENTIAL;
	}
	return DeviceAuthCapability.NONE;
}

export async function refreshDeviceAuthStatus(): Promise<DeviceAuthStatus> {
	if (!Capacitor.isNativePlatform()) {
		return {
			checkedAtMs: Date.now(),
			capability: DeviceAuthCapability.NONE,
		};
	}

	const info = await BiometricAuth.checkBiometry();
	return {
		checkedAtMs: Date.now(),
		capability: getDeviceAuthCapability(info),
	};
}
