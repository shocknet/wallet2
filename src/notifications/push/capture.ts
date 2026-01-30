import { Capacitor } from "@capacitor/core";
import { setIntent, parsePushIntentFromPayload, parsePushIntentFromUrl, hasPushParams } from "./intentBus";
import { PushNotifications } from "@capacitor/push-notifications";

export function captureWebEarly() {
	// cold start (deeplink params)
	const u = new URL(window.location.href);
	const intent = parsePushIntentFromUrl(u);
	if (hasPushParams(u)) {
		console.log("[Push] Cold start with push params:", intent);
		// scrub url
		u.searchParams.delete("push");
		u.searchParams.delete("identity_hint");
		u.searchParams.delete("action_type");
		u.searchParams.delete("notif_op_id");
		history.replaceState({}, "", u.toString());
	}
	if (intent) {
		setIntent(intent);
	}

	// warm (postMessage)
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.addEventListener("message", (event) => {
			console.log("[Push] Service worker message:", event.data);
			const d = event.data;
			const parsed = parsePushIntentFromPayload(d, "web");
			if (!parsed) return;
			console.log("[Push] Parsed intent from service worker:", parsed);
			setIntent(parsed);
		});
	}
}


export function captureNativeEarly() {
	const platform = Capacitor.getPlatform();
	if (platform === "web") return;

	PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
		console.log("[Push] Native notification tapped:", action);
		const d: any = action.notification?.data ?? {};
		const parsed = parsePushIntentFromPayload(d, platform as "ios" | "android");
		if (!parsed) {
			console.warn("[Push] Failed to parse native notification data");
			return;
		}
		console.log("[Push] Parsed native intent:", parsed);
		setIntent(parsed);
	});
}
