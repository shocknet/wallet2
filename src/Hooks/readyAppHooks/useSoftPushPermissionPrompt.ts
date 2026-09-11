import { useEffect, useRef } from "react";
import { useOverlayCoordinator } from "@/overlay";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { getNotificationsPermission, requestNotificationsPermission } from "@/notifications/permission";
import { useLocalStorage } from "../useLocalStorage/useLocalStorage";
import { refreshPushRegistration } from "@/notifications/push/register";
import { useTryPromptDecisionModal } from "@/Components/prompt/Decision";

const SEEN_KEY = "notif_prompt_seen";

export function useSoftPushPermissionPrompt() {
	const dispatch = useAppDispatch();
	const askPushPermission = useTryPromptDecisionModal();
	const { occupied } = useOverlayCoordinator();
	const { showToast } = useToast();
	const [seen, setSeen] = useLocalStorage({ key: SEEN_KEY, defaultValue: false });
	const startedRef = useRef(false);

	useEffect(() => {
		if (seen || occupied || startedRef.current) return;
		startedRef.current = true;

		void (async () => {
			const status = await getNotificationsPermission();
			if (status !== "prompt") return;

			const outcome = await askPushPermission({
				title: "Stay updated",
				description: "Get instant notifications for incoming payments and important account activity.",
				confirmButtonLabel: "Enable",
				denyButtonLabel: "Not now",
			});
			if (outcome.status === "skipped") {
				startedRef.current = false;
				return;
			}

			setSeen(true);
			if (outcome.value.role !== "confirm") return;

			try {
				const perm = await requestNotificationsPermission();
				if (perm !== "granted") return;
				await dispatch(refreshPushRegistration());
				showToast({
					message: "Notifications enabled!",
					color: "success",
					duration: 2000,
				});
			} catch (err) {
				console.error("Failed to enable notifications", err);
				showToast({
					message: "Unable to enable notifications. You can try again in Settings.",
					color: "warning",
					duration: 4000,
				});
			}
		})();
	}, [dispatch, askPushPermission, showToast, seen, setSeen, occupied]);
}
