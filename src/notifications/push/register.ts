import { Capacitor } from "@capacitor/core";
import { registerNativePush } from "./nativeToken";
import { registerWebPush } from "./webToken";
import { getNotificationsPermission } from "../permission";
import { PushRegistrationResult } from "./types";
import store from "@/State/store/store";
import { runtimeActions } from "@/State/runtime/slice";
import { getCachedPushToken, setCachedPushToken } from "./tokenCache";
import { pushTokenUpdated } from "./actions";


export async function registerPushIfGranted(): Promise<PushRegistrationResult> {
	const perm = await getNotificationsPermission();
	console.log({ perm })
	if (perm !== "granted") return { status: perm };

	if (Capacitor.isNativePlatform()) {
		return registerNativePush();
	}

	return registerWebPush();

}

export async function refreshPushRegistration(): Promise<void> {
	let result: PushRegistrationResult;

	try {
		result = await registerPushIfGranted();
	} catch (err) {
		console.error("push registration error: ", err)
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
			console.log("[Push] New token registered:", result.token.substring(0, 20) + "...");
			await setCachedPushToken(result.token);
			store.dispatch(pushTokenUpdated({ token: result.token }));
		} else {
			console.log("[Push] Using cached token");
		}
	} else {
		console.warn("[Push] Registration result:", result);
	}
}
