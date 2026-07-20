import { memo } from "react";
import { useTheme } from "@/Hooks/useTheme";
import { useDeepLinks } from "@/Hooks/useDeepLinks";
import { usePressBackAgainToExit } from "@/Hooks/useBackAgainToExit";

export const ShellEffects = memo(function ShellEffects() {
	usePressBackAgainToExit();
	useTheme();
	useDeepLinks();
	return null;
});
