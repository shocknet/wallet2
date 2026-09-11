import { memo } from "react";
import { useSoftPushPermissionPrompt } from "@/Hooks/readyAppHooks/useSoftPushPermissionPrompt";
import { useHandleWarmPushTap } from "@/Hooks/useHandleWarmPushTap";
import { useAuthRequestsModal } from "@/Components/Modals/AuthRequestsHost";
import { useWatchClipboard } from "@/Hooks/useWatchClipboard";
import { useConsumePendingIntent } from "@/Hooks/readyAppHooks/useConsumePendingIntent";

export const ReadyAppEffects = memo(function ReadyAppEffects() {
	useSoftPushPermissionPrompt();
	useHandleWarmPushTap();
	useAuthRequestsModal();
	useWatchClipboard();
	useConsumePendingIntent();

	return null;
});
