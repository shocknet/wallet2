import { useCallback, useEffect } from "react";
import { App } from "@capacitor/app";
import { useDispatch, useSelector } from "@/State/store/store";
import { useAlert } from "../contexts/useAlert";
import { usePreference } from "../hooks/usePreference";
import { isPlatform } from "@ionic/react";


const DENIED_NOTIFICATIONS_PERMISSIONS = "notif_perms_denied";


export const useAppLifecycle = () => {
	const dispatch = useDispatch();

	const nodedUp = useSelector(state => state.appState.bootstrapped);

	const { cachedValue, setValue, isLoaded } = usePreference<boolean>(DENIED_NOTIFICATIONS_PERMISSIONS, false);

	const { showAlert } = useAlert();




	useEffect(() => {
		console.log("App started: Running initial setup...");

		const tasks = () => {

		}

		// App start
		const appStartUp = async () => {
			if (nodedUp) { // tasks that should only take place after noding up
				tasks();
			}
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

