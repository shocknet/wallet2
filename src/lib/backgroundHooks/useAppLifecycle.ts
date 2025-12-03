import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useDispatch } from "@/State/store/store";
import { useAlert } from "../contexts/useAlert";

import { initLocalNotifications } from "../local-notifications";





export const useAppLifecycle = () => {
	const dispatch = useDispatch();

	const { showAlert } = useAlert();




	useEffect(() => {


		initLocalNotifications(showAlert);


		// App resume
		const onAppResume = async () => {
			console.log("App resumed");
			initLocalNotifications(showAlert);
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
	}, [dispatch, showAlert])
};

