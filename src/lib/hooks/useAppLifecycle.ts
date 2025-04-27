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
	const history = useHistory();

	const nodedUp = useSelector(state => state.nostrPrivateKey);
	const savedAssets = useSelector(state => state.generatedAssets.assets)

	const { cachedValue, setValue, isLoaded } = usePreference<boolean>(DENIED_NOTIFICATIONS_PERMISSIONS, false);

	const { showAlert } = useAlert();
	const clipboardAlertShown = useRef(false);

	const isFocused = useRef(false);

	const checkClipboard = useCallback(async () => {
		if (!isFocused.current) {
			await new Promise(resolve => setTimeout(resolve, 300));
			if (!isFocused.current) return;
		}
		let text = "";

		try {
			const { type, value } = await Clipboard.read();
			if (type === "text/plain") {
				text = value;
			}
		} catch (err) {
			console.error("Cannot read clipboard", err);
			return;
		}
		if (!text.length) {
			return;
		}
		if (savedAssets?.includes(text)) {
			return;
		}
		const classification = identifyBitcoinInput(text);
		if (classification === InputClassification.UNKNOWN) {
			return;
		}

		if (clipboardAlertShown.current) {
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

						history.push({
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
		console.log("App started: Running initial setup...");

		const tasks = () => {
			dispatch(listenforNewOperations());
			checkClipboard();
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

		const listener = App.addListener("appStateChange", async (state) => {
			if (state.isActive) {
				await new Promise(resolve => setTimeout(resolve, 100));
				isFocused.current = true;
				onAppResume();
			} else {
				isFocused.current = false;
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
