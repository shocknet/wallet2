import { beforeEach, describe, expect, it, vi } from "vitest";
import { AndroidBiometryStrength } from "@aparajita/capacitor-biometric-auth";
import { getDeviceAuthCapability, refreshDeviceAuthStatus } from "./capability";
import { resolveAuthPrompt, resolveDeviceAuthStatus, withDeviceAuth } from "./guard";
import { DeviceAuthCapability, type DeviceAuthStatus } from "./types";
import store from "@/State/store/store";
import { runtimeActions, selectDeviceAuthStatus } from "@/State/runtime/slice";

const makeStatus = (partial: Partial<DeviceAuthStatus>): DeviceAuthStatus => ({
	checkedAtMs: Date.now(),
	capability: DeviceAuthCapability.NONE,
	...partial,
});

vi.mock("./capability", async (importOriginal) => {
	const actual = await importOriginal<typeof import("./capability")>();
	return {
		...actual,
		refreshDeviceAuthStatus: vi.fn(actual.refreshDeviceAuthStatus),
	};
});

describe("getDeviceAuthCapability", () => {
	it("prefers strong biometry over weaker paths", () => {
		expect(getDeviceAuthCapability({
			strongBiometryIsAvailable: true,
			isAvailable: true,
			deviceIsSecure: true,
		} as never)).toBe(DeviceAuthCapability.STRONG_BIOMETRY);
	});

	it("prefers weak biometry over device credential when biometry is available", () => {
		expect(getDeviceAuthCapability({
			strongBiometryIsAvailable: false,
			isAvailable: true,
			deviceIsSecure: true,
		} as never)).toBe(DeviceAuthCapability.WEAK_BIOMETRY);
	});

	it("classifies weak biometry when biometry is available but the device is not secure", () => {
		expect(getDeviceAuthCapability({
			strongBiometryIsAvailable: false,
			isAvailable: true,
			deviceIsSecure: false,
		} as never)).toBe(DeviceAuthCapability.WEAK_BIOMETRY);
	});

	it("classifies pin-only secure devices", () => {
		expect(getDeviceAuthCapability({
			strongBiometryIsAvailable: false,
			isAvailable: false,
			deviceIsSecure: true,
		} as never)).toBe(DeviceAuthCapability.DEVICE_CREDENTIAL);
	});

	it("returns none when the device has no auth path", () => {
		expect(getDeviceAuthCapability({
			strongBiometryIsAvailable: false,
			isAvailable: false,
			deviceIsSecure: false,
		} as never)).toBe(DeviceAuthCapability.NONE);
	});
});

describe("refreshDeviceAuthStatus", () => {
	it("classifies strong biometry", async () => {
		vi.mocked(refreshDeviceAuthStatus).mockResolvedValueOnce(makeStatus({
			capability: DeviceAuthCapability.STRONG_BIOMETRY,
		}));

		const status = await refreshDeviceAuthStatus();
		expect(status.capability).toBe(DeviceAuthCapability.STRONG_BIOMETRY);
	});
});

describe("resolveAuthPrompt", () => {
	it("skips when there is no device auth path", () => {
		expect(resolveAuthPrompt(DeviceAuthCapability.NONE)).toBeNull();
	});

	it("uses weak biometry with credential fallback", () => {
		expect(resolveAuthPrompt(DeviceAuthCapability.WEAK_BIOMETRY)).toEqual({
			androidBiometryStrength: AndroidBiometryStrength.weak,
			allowDeviceCredential: true,
			iosFallbackTitle: "Use passcode",
			androidConfirmationRequired: true,
		});
	});

	it("uses strong biometry with credential fallback", () => {
		expect(resolveAuthPrompt(DeviceAuthCapability.STRONG_BIOMETRY)).toEqual({
			androidBiometryStrength: AndroidBiometryStrength.strong,
			allowDeviceCredential: true,
			iosFallbackTitle: "Use passcode",
		});
	});

	it("prompts device credential for pin-only devices", () => {
		expect(resolveAuthPrompt(DeviceAuthCapability.DEVICE_CREDENTIAL)).toEqual({
			allowDeviceCredential: true,
		});
	});
});

describe("resolveDeviceAuthStatus", () => {
	beforeEach(() => {
		vi.mocked(refreshDeviceAuthStatus).mockClear();
		store.dispatch(runtimeActions.setDeviceAuthStatus({
			deviceAuth: makeStatus({
				checkedAtMs: null,
				capability: DeviceAuthCapability.NONE,
			}),
		}));
	});

	it("refreshes when runtime status has not been checked yet", async () => {
		vi.mocked(refreshDeviceAuthStatus).mockResolvedValue(makeStatus({
			capability: DeviceAuthCapability.STRONG_BIOMETRY,
		}));

		const status = await resolveDeviceAuthStatus();

		expect(refreshDeviceAuthStatus).toHaveBeenCalledTimes(1);
		expect(status.capability).toBe(DeviceAuthCapability.STRONG_BIOMETRY);
		expect(selectDeviceAuthStatus(store.getState()).capability).toBe(DeviceAuthCapability.STRONG_BIOMETRY);
	});

	it("reuses cached status once initialized", async () => {
		store.dispatch(runtimeActions.setDeviceAuthStatus({
			deviceAuth: makeStatus({
				capability: DeviceAuthCapability.DEVICE_CREDENTIAL,
			}),
		}));

		const status = await resolveDeviceAuthStatus();

		expect(refreshDeviceAuthStatus).not.toHaveBeenCalled();
		expect(status.capability).toBe(DeviceAuthCapability.DEVICE_CREDENTIAL);
	});
});

describe("withDeviceAuth", () => {
	it("runs callback without prompting when device auth is unavailable", async () => {
		store.dispatch(runtimeActions.setDeviceAuthStatus({
			deviceAuth: makeStatus({
				capability: DeviceAuthCapability.NONE,
			}),
		}));
		const callback = vi.fn().mockResolvedValue("ok");
		const result = await withDeviceAuth({ reason: "Test auth" }, callback);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(result).toBe("ok");
	});
});
