import { getCluster } from "@/Api/nostr";
import { refreshPushRegistration } from "@/notifications/push/register";
import { runtimeActions } from "@/State/runtime/slice";
import { useAppDispatch } from "@/State/store/hooks";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

export function useRegisterRootLifecycle() {
	const dispatch = useAppDispatch();

	useEffect(() => {
		const handle = App.addListener("appStateChange", ({ isActive }) => {
			if (Capacitor.isNativePlatform()) {
				getCluster().lifecycle.setDesiredActive(isActive);
				dispatch(refreshPushRegistration());
			}
			dispatch(runtimeActions.setAppActiveStatus({ active: isActive }));

		});
		return () => {
			void handle.then((listener) => listener.remove());
		};
	}, [dispatch]);
}
