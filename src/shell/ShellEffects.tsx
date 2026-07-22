import { memo } from "react";
import { useTheme } from "@/Hooks/useTheme";
import { useDeepLinks } from "@/Hooks/useDeepLinks";
import { usePressBackAgainToExit } from "@/Hooks/useBackAgainToExit";
import { useRegisterRootLifecycle } from "@/Hooks/useRegisterRootLifecycle";
import { useDeviceAuthRuntime } from "@/Hooks/useDeviceAuthRuntime";

export const ShellEffects = memo(function ShellEffects() {
	useRegisterRootLifecycle();
	useDeviceAuthRuntime();
	usePressBackAgainToExit();
	useTheme();
	useDeepLinks();

	return null;
});
