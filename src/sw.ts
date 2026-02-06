/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { parseEnvelopeJsonString } from './notifications/push/intentBus';
import { storePendingEnvelope } from './notifications/push/envelopeStore';

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

	event.waitUntil((async () => {
		// Store envelope in IndexedDB for app to pick up
		if (envelope) {
			await storePendingEnvelope(envelope);
			console.log("[SW] Envelope stored in IndexedDB");
		}

		const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
		console.log("[SW] Found clients:", clients.length);

		if (clients.length > 0) {
			// Warm start: focus existing window
			// App will check IndexedDB on focus/visibility change
			console.log("[SW] Focusing existing window");
			try {
				await clients[0].focus();
				console.log("[SW] Window focused");
			} catch (err) {
				console.error("[SW] Failed to focus:", err);
			}
		} else {
			// Cold start: open new window
			// App will check IndexedDB on startup
			console.log("[SW] Opening new window");
			await self.clients.openWindow("/");
		}
	})());
});


import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';


const firebaseApp = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG));
console.log("firebaseApp", firebaseApp);
getMessaging(firebaseApp);
