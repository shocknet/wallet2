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
	console.log("[SW] Notification clicked");
	event.notification.close();
	const data = event.notification?.data["FCM_MSG"]?.data?.raw;
	console.log("[SW] Raw data:", data);

	const envelope = typeof data === "string" ? parseEnvelopeJsonString(data) : null;
	console.log("[SW] Parsed envelope:", envelope);

	event.waitUntil((async () => {
		const clients = await self.clients.matchAll({
			type: "window",
			includeUncontrolled: true
		});
		console.log("[SW] Found clients:", clients.length);

		if (clients.length > 0) {
			const client = clients[0];
			console.log("[SW] Using client:", client.url, "focused:", client.focused);

			// Focus the window
			let focusedClient = client;
			try {
				focusedClient = await client.focus();
				console.log("[SW] Window focused successfully");
			} catch (err) {
				console.error("[SW] Failed to focus:", err);
			}

			// Send message via postMessage
			if (envelope) {
				try {
					console.log("[SW] Sending postMessage with envelope");
					focusedClient.postMessage(envelope);
					console.log("[SW] postMessage sent");
				} catch (err) {
					console.error("[SW] postMessage failed:", err);
				}
			}
			return;
		}

		// No existing window, open new one with envelope in URL
		console.log("[SW] No existing window, opening new");
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
import { en } from 'zod/v4/locales';

const firebaseApp = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG));
console.log("firebaseApp", firebaseApp);
getMessaging(firebaseApp);
