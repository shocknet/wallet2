import { Capacitor } from "@capacitor/core";
import { setIntent, parsePushIntentFromPayload, parsePushIntentFromUrl, hasPushParams } from "./intentBus";
import { PushNotifications } from "@capacitor/push-notifications";

export function captureWebEarly() {
	// cold start (deeplink params)
	const u = new URL(window.location.href);
	const intent = parsePushIntentFromUrl(u);
	if (hasPushParams(u)) {
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
			console.log("got postMessage", event)
			const d = event.data;
			const parsed = parsePushIntentFromPayload(d, "web");
			if (!parsed) return;
			setIntent(parsed);
		});
	}
}


export function captureNativeEarly() {
	const platform = Capacitor.getPlatform();
	if (platform === "web") return;

	PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
		const d: any = action.notification?.data ?? {};
		const parsed = parsePushIntentFromPayload(d, platform as "ios" | "android");
		if (!parsed) return;
		setIntent(parsed);
	});
}
