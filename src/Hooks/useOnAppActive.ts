import { useEffect, } from "react";
import { App } from "@capacitor/app";
import { useEventCallback } from "@/Hooks/useEventCallback";

export function useOnAppActive(onActive: () => void) {
	const stableOnActive = useEventCallback(onActive);

	useEffect(() => {
		const handle = App.addListener("appStateChange", ({ isActive }) => {
			if (isActive) {
				stableOnActive();
			}

		});

		return () => {
			void handle.then((listener) => listener.remove());
		};
	}, [stableOnActive]);
}
