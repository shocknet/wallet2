/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { parseEnvelopeJsonString } from './notifications/push/intentBus';

self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const data = event.notification?.data["FCM_MSG"].data.raw;
	console.log("data in service worker", data);

	const envelope = typeof data === "string" ? parseEnvelopeJsonString(data) : null;
	console.log("parsed envelope in service worker", envelope);

	event.waitUntil((async () => {
		const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

		if (wins.length) {


			if (envelope) {
				try {
					console.log("posting message to window", envelope);
					wins[0].postMessage(envelope);
				} catch {
					/* ignore */
				}
			}
			try {
				await wins[0].focus();
			} catch {
				/* ignore focus errors */
			}
			return;
		}

		if (envelope) {
			const url = new URL("/", self.location.origin);
			url.searchParams.set("push", "1");
			url.searchParams.set("push_envelope", encodeURIComponent(JSON.stringify(envelope)));
			await self.clients.openWindow(url.toString());
		} else {
			await self.clients.openWindow("/");
		}
	})());
});


import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';

const firebaseApp = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG));
console.log("firebaseApp", firebaseApp);
getMessaging(firebaseApp);
