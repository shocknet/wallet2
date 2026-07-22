import { memo } from "react";
import { useSoftPushPermissionPrompt } from "@/Hooks/readyAppHooks/useSoftPushPermissionPrompt";
import { useWatchClipboard } from "@/Hooks/useWatchClipboard";
import { useHandleWarmPushTap } from "@/Hooks/useHandleWarmPushTap";
import { useConsumePendingNav } from "@/Hooks/readyAppHooks/useConsumePendingNav";

export const ReadyAppEffects = memo(function ReadyAppEffects() {
	useSoftPushPermissionPrompt();
	useWatchClipboard();
	useHandleWarmPushTap();
	useConsumePendingNav()


	return null;
});
