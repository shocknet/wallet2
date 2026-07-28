import { useEffect, useRef } from "react";
import { useAlert } from "@/lib/contexts/useAlert";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { getNotificationsPermission, requestNotificationsPermission } from "@/notifications/permission";
import { useLocalStorage } from "../useLocalStorage/useLocalStorage";
import { refreshPushRegistration } from "@/notifications/push/register";

const SEEN_KEY = "notif_prompt_seen";

export function useSoftPushPermissionPrompt() {
	const dispatch = useAppDispatch();
	const { showAlert } = useAlert();
	const { showToast } = useToast();

	const [seen, setSeen] = useLocalStorage({ key: SEEN_KEY, defaultValue: false });

	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) {
			return;
		}
		startedRef.current = true;

		let cancelled = false;

		void (async () => {
			if (seen) {
				return;
			}

			const status = await getNotificationsPermission();
			if (cancelled || status !== "prompt") {
				return;
			}

			setSeen(true);

			const { role } = await showAlert({
				header: "Stay Updated",
				message:
					"Get instant notifications for incoming payments and important account activity.",
				buttons: [
					{ text: "Not Now", role: "cancel" },
					{ text: "Enable", role: "confirm" },
				],
			});

			if (cancelled || role !== "confirm") {
				return;
			}


			try {
				const perm = await requestNotificationsPermission();
				if (perm !== "granted") {
					return;
				}
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

		return () => {
			cancelled = true;
		};
	}, [dispatch, showAlert, showToast, seen, setSeen]);
}
