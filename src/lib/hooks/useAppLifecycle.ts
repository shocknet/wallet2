import { useCallback, useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { useDispatch, useSelector } from "@/State/store";
import { listenforNewOperations } from "@/State/history";
import { SplashScreen } from "@capacitor/splash-screen";
import { useAlert } from "../contexts/useAlert";
import { usePreference } from "./usePreference";
import { isPlatform } from "@ionic/react";
import { Clipboard } from "@capacitor/clipboard";
import { InputClassification } from "../types/parse";
import { addAsset } from "@/State/Slices/generatedAssets";
import { useHistory } from "react-router";
import { truncateTextMiddle } from "../format";
import { parseBitcoinInput as legacyParseBitcoinInput } from "@/constants";

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
			listener.then(h => h.remove());
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, nodedUp]);



	/* Handle notifications */
	const handleInitNotifications = useCallback(async () => {
		if (cachedValue) {
			return;
		}

		let initLocalNotifications;
		try {
			({ initLocalNotifications } = await import("@/lib/local-notifications"))
		} catch (err) {
			console.error('Failed to lazy-load "@/lib/local-notifications"', err);
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


		if (isLoaded) {
			handleInitNotifications();
		}


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
			listener.then(h => h.remove());
		};
	}, [dispatch, isLoaded, handleInitNotifications])
};


const useWatchClipboard = () => {
	const { showAlert } = useAlert();
	const dispatch = useDispatch();

	const history = useHistory();

	const nodedup = useSelector(state => state.nostrPrivateKey)
	const savedAssets = useSelector(state => state.generatedAssets.assets);

	const clipboardAlertShown = useRef(false);
	const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastCheckRef = useRef(0);

	const checkClipboard = useCallback(async () => {
		if (Date.now() - lastCheckRef.current < 500) return;
		if (!nodedup) return; // don't check clipboard if not noded up
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



		let identifyBitcoinInput
		let parseBitcoinInput

		try {
			({ identifyBitcoinInput, parseBitcoinInput } = await import('@/lib/parse'));
		} catch (err) {
			console.error('Failed to lazy-load "@/lib/parse"', err);
			return;
		}

		const classification = identifyBitcoinInput(text);

		if (
			!text.length ||
			(savedAssets || []).includes(text) ||
			clipboardAlertShown.current ||
			classification === InputClassification.UNKNOWN
		) {
			return;
		}

		clipboardAlertShown.current = true;

		const clipboardAlertHandler = async () => {
			try {
				const parsed = await parseBitcoinInput(text, classification);
				if (parsed.type === InputClassification.LNURL_WITHDRAW) {
					const legacyParsedLnurlW = await legacyParseBitcoinInput(text);
					history.push({
						pathname: "/sources",
						state: legacyParsedLnurlW
					})
					return;
				} else {
					history.push({
						pathname: "/send",
						state: {
							// pass the input string as opposed to parsed object because in the case of noffer it needs the selected source
							input: parsed.data
						}
					})
				}
			} catch (err: any) {
				console.error("Error parsing clipboard input:", err);
				showAlert({
					header: "Error",
					message: err?.message || "Unknown error occurred while parsing clipboard input.",
					buttons: ["OK"]
				});
			}
		}


		showAlert({
			header: "Clipboard Detected",
			subHeader: "Do you want to use the content from your clipboard?",
			message: truncateTextMiddle(text, 20),
			onWillDismiss: () => {
				dispatch(addAsset({ asset: text }));
				clipboardAlertShown.current = false;
			},
			buttons: [
				{
					text: "No",
					role: "cancel",
				},
				{
					text: "Yes",
					handler: clipboardAlertHandler,
				}
			]
		})
	}, [savedAssets, dispatch, history, showAlert, nodedup])

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
			sub.then(h => h.remove())
			clearTimeout(retryTimer.current!);
		};
	}, [checkClipboard]);
}
