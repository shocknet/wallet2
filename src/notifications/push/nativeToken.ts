import { PushNotifications, } from "@capacitor/push-notifications";
import { PushRegistrationResult } from "./types";
import { getNotificationsPermission } from "../permission";



export async function registerNativePush(): Promise<PushRegistrationResult> {
	const perm = await getNotificationsPermission()
	if (perm !== "granted") return { status: perm };

	await PushNotifications.register();
	return await new Promise<PushRegistrationResult>((resolve) => {
		PushNotifications.addListener("registration", (t) => (
			resolve({
				status: "registered",
				token: t.value
			})
		));
		PushNotifications.addListener("registrationError", (err) => (
			resolve({ status: "error", error: err.error })
		));
	});
}
