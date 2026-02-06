/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { parseEnvelopeJsonString } from './notifications/push/intentBus';


import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';


const firebaseApp = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG));
console.log("firebaseApp", firebaseApp);
getMessaging(firebaseApp);


self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.addEventListener("notificationclick", (event) => {
	console.log("[SW] Notification clicked");
	event.notification.close();
	const data = event.notification?.data["FCM_MSG"]?.data?.raw;
	console.log("[SW] Raw data:", data);

	const envelope = typeof data === "string" ? parseEnvelopeJsonString(data) : null;
	console.log("[SW] Parsed envelope:", envelope);

	event.waitUntil(
		self.clients.matchAll({
			type: "window",
			includeUncontrolled: true
		}).then(clientsList => {
			for (const client of clientsList) {
				if (client.url.includes(self.location.origin) && "focus" in client) {
					if (envelope) {
						client.postMessage(envelope);
					}
					return client.focus();
				}
			}

			if (self.clients.openWindow) {
				const url = new URL("/", self.location.origin);
				if (envelope) {
					url.searchParams.set("push", "1");
					url.searchParams.set("push_envelope", encodeURIComponent(JSON.stringify(envelope)));
				}
				return self.clients.openWindow(url.toString());
			}
		})
	);
});

