import { useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { getNostrClient } from "@/Api/nostr";
import { selectNostrSpends, useSelector } from "@/State/store/store";
import { getDeviceId } from "@/constants";
import { SpendFrom } from "@/globalTypes";
import { parseNprofile } from "../nprofile";


/* const firebaseConfig = {
	apiKey: "AIzaSyA6YFA5tr2AHMVVXwLU00s_bVQekvXyN-w",
	authDomain: "shockwallet-11a9c.firebaseapp.com",
	projectId: "shockwallet-11a9c",
	storageBucket: "shockwallet-11a9c.firebasestorage.app",
	messagingSenderId: "73069543153",
	appId: "1:73069543153:web:048e09fb8a258acb7ab350",
	measurementId: "G-HQ89PZ3GPW"
};
const vapidKey = "BExGVgcmXFE2pMPG2iPGCyYINHGD6B_dzkcH3EqbzXK8bpS6uuSt_bs78blau2NrJoyBOv044CgA0-UtVz8YzrI" */

const enrollToken = async (nostrSpends: SpendFrom[]) => {
	console.log("enrolling messagingtoken")
	const firebaseApp = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG))
	const firebaseMessaging = getMessaging(firebaseApp);
	const swReg = await navigator.serviceWorker.ready; // Get sw.js registration and pass it to getToken
	const token = await getToken(firebaseMessaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: swReg });
	console.log({ messagingToken: token })
	for (const source of nostrSpends) {
		if (!source.keys || !source.pubSource) continue;
		const { pubkey, relays } = parseNprofile(source.pasteField)
		const c = await getNostrClient({ pubkey, relays }, source.keys)
		const res = await c.EnrollMessagingToken({ device_id: getDeviceId(), firebase_messaging_token: token })
		if (res.status === "OK") {
			console.log("enrolled token for", source.label)
		} else {
			console.error("error enrolling token for", source.label, res.reason)
		}
	}
}

export const useFirebaseHandler = () => {
	const nostrSpends = useSelector(selectNostrSpends);
	const nodedUp = !!useSelector(state => state.appState.bootstrapped);

	useEffect(() => {
		if (!nodedUp) {
			return;
		}
		enrollToken(nostrSpends)
	}, [nodedUp, nostrSpends])
}

