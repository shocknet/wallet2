import { Capacitor } from "@capacitor/core";
import { registerNativePush } from "./nativeToken";
import { registerWebPush } from "./webToken";
import { getNotificationsPermission } from "../permission";
import { PushRegistrationResult } from "./types";
import store from "@/State/store/store";
import { runtimeActions } from "@/State/runtime/slice";
import { getCachedPushToken, setCachedPushToken } from "./tokenCache";
import { pushTokenUpdated } from "./actions";
import dLogger from "@/Api/helpers/debugLog";

const log = dLogger.withContext({ component: "push-register" });

export async function registerPushIfGranted(): Promise<PushRegistrationResult> {
	const perm = await getNotificationsPermission();
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
		log.error("registration_error", { error: err });
		result = err instanceof Error
			? { status: "error", error: err.message }
			: { status: "error", error: "Unknown error when registering push notifications" };
	}

	store.dispatch(runtimeActions.setPushRuntimeStatus({ pushStatus: result }));

	if (result.status === "registered") {
		const prev = getCachedPushToken();
		if (prev !== result.token) {
			log.info("token_registered", { data: { tokenPrefix: result.token.substring(0, 12) + "…" } });
			await setCachedPushToken(result.token);
			store.dispatch(pushTokenUpdated({ token: result.token }));
		} else {
			log.debug("token_unchanged", {});
		}
	} else {
		log.warn("registration_result", { data: { status: result.status, error: result.status === "error" ? result.error : undefined } });
	}
}
