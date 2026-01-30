/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { parsePushIntentFromPayload } from './notifications/push/intentBus';

self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const data = event.notification?.data ?? {};



	const intent = parsePushIntentFromPayload(data, "web");

	event.waitUntil((async () => {
		const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

		if (wins.length) {
			if (intent) {
				try {
					wins[0].postMessage(intent);
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

		if (intent) {
			const url = new URL("/", self.location.origin);
			url.searchParams.set("push", "1");
			if (intent.identityHint) url.searchParams.set("identity_hint", intent.identityHint);
			if (intent.actionData) {
				url.searchParams.set("action_type", intent.actionData.action_type);
				if (intent.actionData.action_type === "payment-received" || intent.actionData.action_type === "payment-sent") {
					url.searchParams.set("notif_op_id", intent.actionData.notif_op_id);
				}
			}
			await self.clients.openWindow(url.toString());
		} else {
			await self.clients.openWindow("/");
		}
	})());
});


import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';

const firebaseApp = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG));
getMessaging(firebaseApp);
