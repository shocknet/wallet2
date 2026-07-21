import { useEffect } from "react";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { Capacitor } from "@capacitor/core";
import {
	getDeviceAuthCapability,
	refreshDeviceAuthStatus,
} from "@/lib/deviceAuth/capability";
import { runtimeActions } from "@/State/runtime/slice";
import { useAppDispatch } from "@/State/store/hooks";
import dLogger from "@/Api/helpers/debugLog";

const log = dLogger.withContext({ component: "device-auth-runtime" });

export function useDeviceAuthRuntime() {
	const dispatch = useAppDispatch();

	useEffect(() => {
		let cancelled = false;

		const applyStatus = (
			status: Awaited<ReturnType<typeof refreshDeviceAuthStatus>>,
		) => {
			if (cancelled) return;
			dispatch(runtimeActions.setDeviceAuthStatus({ deviceAuth: status }));
		};

		void refreshDeviceAuthStatus()
			.then(applyStatus)
			.catch((error) => {
				log.error("Failed to initialize device auth runtime", { error });
			});

		if (!Capacitor.isNativePlatform()) {
			return () => {
				cancelled = true;
			};
		}

		const resumeListener = BiometricAuth.addResumeListener((info) => {
			applyStatus({
				checkedAtMs: Date.now(),
				capability: getDeviceAuthCapability(info),
			});
		});

		return () => {
			cancelled = true;
			void resumeListener
				.then((handle) => handle.remove())
				.catch(() => { });
		};
	}, [dispatch]);
}
