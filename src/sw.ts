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
	const data = event.notification?.data["FCM_MSG"].data.raw;
	console.log("[SW] Notification data:", data);

	const envelope = typeof data === "string" ? parseEnvelopeJsonString(data) : null;
	console.log("[SW] Parsed envelope:", envelope);

	event.waitUntil((async () => {
		const wins = await self.clients.matchAll({
			type: "window",
			includeUncontrolled: true
		});

		if (wins.length) {
			console.log("[SW] Found existing window, count:", wins.length);

			// Focus first, then send message (Safari needs this order)
			try {
				await wins[0].focus();
				console.log("[SW] Window focused");
			} catch (err) {
				console.error("[SW] Failed to focus window:", err);
			}

			// Wait a tick for Safari to settle the focus
			await new Promise(resolve => setTimeout(resolve, 100));

			if (envelope) {
				// Try postMessage to all windows (Safari might need controlled client)
				let sent = false;
				for (const client of wins) {
					try {
						console.log("[SW] Attempting postMessage to client:", client.id);
						client.postMessage(envelope);
						sent = true;
						console.log("[SW] postMessage sent successfully");
					} catch (err) {
						console.error("[SW] postMessage failed:", err);
					}
				}

				// Fallback: Use BroadcastChannel for Safari
				if (!sent) {
					try {
						console.log("[SW] Trying BroadcastChannel fallback");
						const channel = new BroadcastChannel('push-notification');
						channel.postMessage(envelope);
						channel.close();
						console.log("[SW] BroadcastChannel message sent");
					} catch (err) {
						console.error("[SW] BroadcastChannel failed:", err);
					}
				}
			}
			return;
		}

		// No existing window, open new one
		console.log("[SW] No existing window, opening new one");
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
