import dLogger from "./Api/helpers/debugLog";
import { initDeviceAuthRuntime } from "./lib/deviceAuth/capability";

import { initLocalNotifications } from "./notifications/local/local-notifications";
import { initPushNotifications } from "./notifications/push/init";
import { registerRootLifecycle } from "./State/runtime/lifecycle";
import store from "./State/store/store";
import { runtimeActions } from "./State/runtime/slice";
export default function bootstrapShockwallet() {
	registerRootLifecycle();
	initPushNotifications();
	initLocalNotifications();
	initDeviceAuthRuntime((deviceAuth) => {
		store.dispatch(runtimeActions.setDeviceAuthStatus({ deviceAuth }));
	}).catch((error) => {
		dLogger.error("Failed to initialize device auth runtime", { error });
	});

}
