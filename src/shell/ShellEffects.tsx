import { memo } from "react";
import { useTheme } from "@/Hooks/useTheme";
import { useDeepLinks } from "@/Hooks/useDeepLinks";
import { usePressBackAgainToExit } from "@/Hooks/useBackAgainToExit";
import { useRegisterRootLifecycle } from "@/Hooks/useRegisterRootLifecycle";
import { useDeviceAuthRuntime } from "@/Hooks/useDeviceAuthRuntime";
import { useNotificationsPermission } from "@/Hooks/useNotificationsPermission";
import { usePushRegistration } from "@/Hooks/usePushRegistration";
import { useLocalNotificationsSetup } from "@/Hooks/useLocalNotificationsSetup";

export const ShellEffects = memo(function ShellEffects() {
	useNotificationsPermission();
	usePushRegistration();
	useRegisterRootLifecycle();
	useDeviceAuthRuntime();
	usePressBackAgainToExit();
	useTheme();
	useDeepLinks();
	useLocalNotificationsSetup();

	return null;
});
