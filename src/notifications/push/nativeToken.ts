import { PushNotifications, } from "@capacitor/push-notifications";
import { PushRegistrationResult } from "./types";




export async function registerNativePush(): Promise<PushRegistrationResult> {
	let resolvePromise: (value: PushRegistrationResult) => void;
	const promise = new Promise<PushRegistrationResult>((resolve) => {
		resolvePromise = resolve;
	});

	const regHandler = await PushNotifications.addListener("registration", (t) => {

		resolvePromise({
			status: "registered",
			token: t.value
		})
	});

	const errHandler = await PushNotifications.addListener("registrationError", (err) => {
		resolvePromise({ status: "error", error: err.error })
	});

	const timeout = setTimeout(() => {
		resolvePromise({ status: "error", error: "Registration timed out" })
	}, 10000);

	await PushNotifications.register();
	return promise.then((result) => {
		regHandler.remove().catch(() => { });
		errHandler.remove().catch(() => { });
		clearTimeout(timeout);
		return result;
	});
}
