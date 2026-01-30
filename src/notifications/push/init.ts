
import store from "@/State/store/store";
import { getCachedPushToken, hydratePushTokenCache, setCachedPushToken } from "./tokenCache";
import { pushTokenUpdated } from "./actions";
import { registerPushIfGranted } from "./register";
import { runtimeActions } from "@/State/runtime/slice";
import { Capacitor } from "@capacitor/core";
import { captureNativeEarly, captureWebEarly } from "./capture";
import { PushRegistrationResult } from "./types";



let inited = false;


export async function initPushNotifications() {
	if (inited) return;

	inited = true;

	if (Capacitor.isNativePlatform()) {
		captureNativeEarly();
	} else {
		captureWebEarly();
	}

	await hydratePushTokenCache();


	let result: PushRegistrationResult;

	try {
		result = await registerPushIfGranted();
	} catch (err) {
		if (err instanceof Error) {
			result = { status: "error", error: err.message };
		} else {
			result = { status: "error", error: "Unknown error occured when registring push notifications" };
		}
	}

	store.dispatch(runtimeActions.setPushRuntimeStatus({ pushStatus: result }));


	if (result.status === "registered") {
		const prev = getCachedPushToken();
		if (prev !== result.token) {
			setCachedPushToken(result.token);
			store.dispatch(pushTokenUpdated({ token: result.token }));
		}

	}
}
