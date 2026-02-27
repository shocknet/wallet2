
import { hydratePushTokenCache } from "./tokenCache";
import { refreshPushRegistration } from "./register";



let inited = false;


export async function initPushNotifications() {
	if (inited) return;

	inited = true;



	await hydratePushTokenCache();

	await refreshPushRegistration();
}
