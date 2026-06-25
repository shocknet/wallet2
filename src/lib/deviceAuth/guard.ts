import {
	AndroidBiometryStrength,
	AuthenticateOptions,
	BiometricAuth,
} from "@aparajita/capacitor-biometric-auth";
import { refreshDeviceAuthStatus } from "./capability";
import {
	DeviceAuthCapability,
	type DeviceAuthStatus,
	type RequireDeviceAuthOptions,
} from "./types";
import store from "@/State/store/store";
import { runtimeActions, selectDeviceAuthStatus } from "@/State/runtime/slice";

type AuthPrompt = Pick<AuthenticateOptions, "allowDeviceCredential" | "androidBiometryStrength" | "iosFallbackTitle" | "androidConfirmationRequired">;




export function resolveAuthPrompt(capability: DeviceAuthCapability): AuthPrompt | null {
	switch (capability) {
		case DeviceAuthCapability.STRONG_BIOMETRY:
			return {
				androidBiometryStrength: AndroidBiometryStrength.strong,
				allowDeviceCredential: true,
				iosFallbackTitle: "Use passcode",

			};
		case DeviceAuthCapability.WEAK_BIOMETRY:
			return {
				androidBiometryStrength: AndroidBiometryStrength.weak,
				allowDeviceCredential: true,
				iosFallbackTitle: "Use passcode",
				androidConfirmationRequired: true,
			};
		case DeviceAuthCapability.DEVICE_CREDENTIAL:
			return {
				allowDeviceCredential: true,
			};
		case DeviceAuthCapability.NONE:
		default:
			return null;
	}
}


export async function resolveDeviceAuthStatus(): Promise<DeviceAuthStatus> {
	const cached = selectDeviceAuthStatus(store.getState());
	if (cached.checkedAtMs !== null) {
		return cached;
	}

	const status = await refreshDeviceAuthStatus();
	store.dispatch(runtimeActions.setDeviceAuthStatus({ deviceAuth: status }));
	return status;
}

export async function requireDeviceAuth(options: RequireDeviceAuthOptions): Promise<void> {
	const status = await resolveDeviceAuthStatus();
	const prompt = resolveAuthPrompt(status.capability);

	if (!prompt) {
		return;
	}


	await BiometricAuth.authenticate({
		reason: options.reason,
		cancelTitle: options.cancelTitle ?? "Cancel",
		iosFallbackTitle: options.iosFallbackTitle,
		androidTitle: options.androidTitle ?? "Authenticate",
		androidSubtitle: options.androidSubtitle ?? options.reason,
		...prompt
	});

}

export async function withDeviceAuth<T>(
	options: RequireDeviceAuthOptions,
	gatedCallback: () => Promise<T> | T,
): Promise<T> {
	await requireDeviceAuth(options);
	return await gatedCallback();
}
