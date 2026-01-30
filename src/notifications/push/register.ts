import { Capacitor } from "@capacitor/core";
import { registerNativePush } from "./nativeToken";
import { registerWebPush } from "./webToken";
import { getNotificationsPermission } from "../permission";
import { PushRegistrationResult } from "./types";


export async function registerPushIfGranted(): Promise<PushRegistrationResult> {
	const perm = await getNotificationsPermission();
	if (perm !== "granted") return { status: perm };

	if (!Capacitor.isNativePlatform()) {
		return registerWebPush();
	}


	return registerNativePush();
}
