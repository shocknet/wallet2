import { useCallback, useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { useDispatch, useSelector } from "@/State/store";
import { listenforNewOperations } from "@/State/history/thunks";
import { SplashScreen } from "@capacitor/splash-screen";
import { initLocalNotifications } from "../local-notifications";
import { useAlert } from "../contexts/useAlert";
import { usePreference } from "./usePreference";
import { isPlatform } from "@ionic/react";
import { Clipboard } from "@capacitor/clipboard";
import { identifyBitcoinInput } from "../parse";
import { InputClassification } from "../types/parse";
import { addAsset } from "@/State/Slices/generatedAssets";
import { useHistory } from "react-router";
import { truncateTextMiddle } from "../format";

const DENIED_NOTIFICATIONS_PERMISSIONS = "notif_perms_denied";


export const useAppLifecycle = () => {
	const dispatch = useDispatch();

	const nodedUp = useSelector(state => state.nostrPrivateKey);

	const { cachedValue, setValue, isLoaded } = usePreference<boolean>(DENIED_NOTIFICATIONS_PERMISSIONS, false);

	const { showAlert } = useAlert();

	useWatchClipboard();







	useEffect(() => {
		console.log("App started: Running initial setup...");

		const tasks = () => {
			dispatch(listenforNewOperations());

		}

		// App start
		const appStartUp = async () => {
			if (nodedUp) { // tasks that should only take place after noding up
				tasks()
			}
			SplashScreen.hide();
		}
		appStartUp();


		// App resume
		const onAppResume = async () => {
			console.log("App resumed");
			if (nodedUp) { // tasks that should only take place after noding up
				tasks()
			}
		};

		// App pause
		const onAppPause = () => {
			console.log("App paused.");
			// Handle background tasks if needed
		};

		const listener = App.addListener("appStateChange", (state) => {
			if (state.isActive) {
				onAppResume();
			} else {
				onAppPause();
			}
		});

		return () => {
			listener.remove();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, nodedUp]);



	/* Handle notifications */
	const handleInitNotifications = useCallback(async () => {
		if (cachedValue) {
			return;
		}

		const hasPermission = await initLocalNotifications();
		if (!hasPermission) {
			showAlert({
				header: "Notifications Disabled",
				message: !isPlatform("hybrid")
					? 'You have blocked notifications in your browser. Please enable them in your browser settings if you wish to receive notifications.'
					: 'Notifications are disabled. Please enable them in your device settings to receive alerts.',
				buttons: ['OK']
			});
		}
		setValue(true);
	}, [cachedValue, setValue, showAlert]);

	useEffect(() => {
		const appStartUp = async () => {
			if (isLoaded) {
				await handleInitNotifications();
			}

		}
		appStartUp();


		// App resume
		const onAppResume = async () => {
			console.log("App resumed");
			if (isLoaded) {
				await handleInitNotifications();
			}
		};

		// App pause
		const onAppPause = () => {
			console.log("App paused.");
			// Handle background tasks if needed
		};

		const listener = App.addListener("appStateChange", (state) => {
			if (state.isActive) {
				onAppResume();
			} else {
				onAppPause();
			}
		});

		return () => {
			listener.remove();
		};
	}, [dispatch, isLoaded, handleInitNotifications])
};


const useWatchClipboard = () => {
	const { showAlert } = useAlert();
	const dispatch = useDispatch();

	const history = useHistory();

	const savedAssets = useSelector(state => state.generatedAssets.assets)

	const clipboardAlertShown = useRef(false);
	const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastCheckRef = useRef(0);

	const checkClipboard = useCallback(async () => {
		if (Date.now() - lastCheckRef.current < 500) return;
		lastCheckRef.current = Date.now();

		if (!document.hasFocus()) return;


		let text = "";

		try {
			const { type, value } = await Clipboard.read();
			if (type === "text/plain") {
				text = value.trim();
			}
		} catch (err) {
			console.error("Cannot read clipboard", err);
			return;
		}

		if (
			!text.length ||
			(savedAssets || []).includes(text) ||
			identifyBitcoinInput(text) === InputClassification.UNKNOWN ||
			clipboardAlertShown.current
		) {
			return;
		}

		clipboardAlertShown.current = true;
		showAlert({
			header: "Clipboard Detected",
			subHeader: "Do you want to use the content from your clipboard?",
			message: truncateTextMiddle(text, 20),
			buttons: [
				{
					text: "No",
					role: "cancel",
					handler: () => {
						clipboardAlertShown.current = false;
					}
				},
				{
					text: "Yes",
					handler: () => {
						clipboardAlertShown.current = false;
						// Handle the clipboard content
						dispatch(addAsset({ asset: text }));

						history.replace({
							pathname: "/send",
							state: {
								input: text
							}
						})
					}
				}
			]
		})
	}, [savedAssets, dispatch, history, showAlert])

	useEffect(() => {
		const focusHandler = () => {
			// wait one tick so the browser definitely flags the doc as focused
			clearTimeout(retryTimer.current!);
			retryTimer.current = setTimeout(checkClipboard, 50);
		};

		const visHandler = () => {
			if (document.visibilityState === "visible") focusHandler();
		};

		document.addEventListener("visibilitychange", visHandler);
		window.addEventListener("focus", focusHandler);

		// Hybrid (Android/iOS) – do the same when app becomes active
		const sub = App.addListener("appStateChange", (s) => {
			if (s.isActive) focusHandler();
		});

		focusHandler();

		return () => {
			document.removeEventListener("visibilitychange", visHandler);
			window.removeEventListener("focus", focusHandler);
			sub.remove();
			clearTimeout(retryTimer.current!);
		};
	}, [checkClipboard]);
}
