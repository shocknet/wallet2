import { BiometricAuth, type CheckBiometryResult } from "@aparajita/capacitor-biometric-auth";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { DeviceAuthCapability, type DeviceAuthStatus } from "./types";

let resumeListenerHandle: PluginListenerHandle | null = null;

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


export async function initDeviceAuthRuntime(
	onStatus: (status: DeviceAuthStatus) => void,
): Promise<void> {
	const status = await refreshDeviceAuthStatus();
	onStatus(status);

	if (!Capacitor.isNativePlatform()) {
		return;
	}

	if (resumeListenerHandle) {
		await resumeListenerHandle.remove();
		resumeListenerHandle = null;
	}

	resumeListenerHandle = await BiometricAuth.addResumeListener((info) => {
		onStatus({
			checkedAtMs: Date.now(),
			capability: getDeviceAuthCapability(info),
		});
	});
}


