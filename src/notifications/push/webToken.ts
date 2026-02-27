import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { PushRegistrationResult } from "./types";
import dLogger from "@/Api/helpers/debugLog";

const log = dLogger.withContext({ component: "push-webToken" });

export async function registerWebPush(): Promise<PushRegistrationResult> {
	if (!isSupported()) return { status: "unsupported" };

	const app = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG));
	const messaging = getMessaging(app);

	const swReg = await navigator.serviceWorker.ready;

	const token = await getToken(messaging, {
		vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
		serviceWorkerRegistration: swReg,
	});

	log.debug("web_token_obtained", { data: { hasToken: !!token } });
	return { status: "registered", token };
}

