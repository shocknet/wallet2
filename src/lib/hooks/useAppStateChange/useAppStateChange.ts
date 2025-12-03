import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { useEventCallback } from "../useEventCallbck/useEventCallback";



interface UseAppStateChangeOptions {
	onChange?: (next: boolean, prev: boolean) => void;
}

export function useAppStateChange(opts: UseAppStateChangeOptions = {}) {
	const { onChange } = opts;

	const [isAppActive, setIsAppActive] = useState(true);

	const stableOnChange = useEventCallback(onChange)



	useEffect(() => {

		let isMounted = true;



		const sub = App.addListener("appStateChange", ({ isActive }) => {
			if (!isMounted) return;

			setIsAppActive((prev) => {
				if (stableOnChange && prev !== isActive) {
					stableOnChange(isActive, prev);
				}
				return isActive;
			});
		});

		return () => {
			isMounted = false;

			sub.then((s) => s.remove()).catch(() => {
				/* ignore */
			});
		};

	}, [stableOnChange]);

	return isAppActive;
}
