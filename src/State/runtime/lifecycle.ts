import { App } from "@capacitor/app"
import store from "../store/store"
import { runtimeActions } from "./slice"
import { Capacitor } from "@capacitor/core"
import { getCluster } from "@/Api/nostr"


export function registerRootLifecycle() {
	if (!Capacitor.isNativePlatform()) return;

	App.addListener("appStateChange", ({ isActive }) => {
		getCluster().lifecycle.setDesiredActive(isActive);
		store.dispatch(runtimeActions.setAppActiveStatus({ active: isActive }));
	});
}

