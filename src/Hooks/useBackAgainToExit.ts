import { BackButtonEvent, useIonRouter, useIonToast } from "@ionic/react";
import { useEffect, useRef } from "react";
import { App } from '@capacitor/app';

const EXIT_WINDOW_MS = 2000;

export function usePressBackAgainToExit() {
	const ionRouter = useIonRouter();
	const [presentToast, dismissToast] = useIonToast();
	const lastPressRef = useRef<number>(0);

	useEffect(() => {
		const onBack = (event: BackButtonEvent) => {
			event.detail.register(-1, () => {

				if (ionRouter.canGoBack()) return;

				const now = Date.now();
				const elapsed = now - lastPressRef.current;

				if (elapsed < EXIT_WINDOW_MS) {
					App.exitApp();
					return;
				}

				lastPressRef.current = now;

				presentToast({
					message: "Press back again to exit",
					duration: EXIT_WINDOW_MS,
					position: "bottom",
				});
			});
		};

		document.addEventListener("ionBackButton", onBack);
		return () => {
			document.removeEventListener("ionBackButton", onBack);
			dismissToast();
		}
	}, [ionRouter, dismissToast, presentToast]);
}
