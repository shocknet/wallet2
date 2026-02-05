import { Capacitor } from "@capacitor/core";
import {
	setIntent,
	parsePushEnvelopeFromPayload,
	parseEnvelopeJsonString,
	parsePushEnvelopeFromUrl,
	hasPushParams,
	decryptPushEnvelope,
	setPendingEnvelope,
	clearPendingEnvelope
} from "./intentBus";
import { PushNotifications } from "@capacitor/push-notifications";
import { resolveTopicTarget } from "./topicResolver";

export function captureWebEarly() {
	// cold start (deeplink params)
	const u = new URL(window.location.href);
	const envelope = parsePushEnvelopeFromUrl(u);
	if (hasPushParams(u)) {
		console.log("[Push] Cold start with push params:", envelope);
		// scrub url
		u.searchParams.delete("push");
		u.searchParams.delete("push_envelope");
		history.replaceState({}, "", u.toString());
	}
	if (envelope) {
		setPendingEnvelope(envelope);
		void resolveTopicTarget(envelope.topic_id).then((resolution) => {
			if (!resolution) return;
			const payload = decryptPushEnvelope(envelope, resolution.privateKey);
			if (!payload) return;
			setIntent({
				topicId: envelope.topic_id,
				payload,
				identityId: resolution.identityId,
				sourceId: resolution.sourceId
			});
			clearPendingEnvelope();
		});
	}

	// warm (postMessage)
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.addEventListener("message", (event) => {
			console.log("[Push] ====== Service worker postMessage received ======");
			console.log("[Push] App state: document.hasFocus =", document.hasFocus());
			console.log("[Push] Message data:", event.data);
			console.log("[Push] Message origin:", event.origin);
			console.trace("[Push] Stack trace for postMessage");

			const d = event.data;
			const parsedEnvelope = parsePushEnvelopeFromPayload(d);
			console.log("[Push] Parsed envelope:", parsedEnvelope);
			if (!parsedEnvelope) {
				console.log("[Push] Failed to parse envelope, ignoring message");
				return;
			}
			setPendingEnvelope(parsedEnvelope);
			void resolveTopicTarget(parsedEnvelope.topic_id).then((resolution) => {
				console.log("[Push] Topic resolution:", resolution);
				if (!resolution) return;
				const payload = decryptPushEnvelope(parsedEnvelope, resolution.privateKey);
				if (!payload) return;
				const intent = {
					topicId: parsedEnvelope.topic_id,
					payload,
					identityId: resolution.identityId,
					sourceId: resolution.sourceId
				};
				console.log("[Push] Setting intent from service worker:", intent);
				setIntent(intent);
				clearPendingEnvelope();
			});
		});
	}

	// BroadcastChannel fallback for Safari
	if (typeof BroadcastChannel !== 'undefined') {
		const channel = new BroadcastChannel('push-notification');
		channel.onmessage = (event) => {
			console.log("[Push] ====== BroadcastChannel message received (Safari fallback) ======");
			console.log("[Push] Channel data:", event.data);

			const parsedEnvelope = parsePushEnvelopeFromPayload(event.data);
			console.log("[Push] Parsed envelope from BroadcastChannel:", parsedEnvelope);
			if (!parsedEnvelope) {
				console.log("[Push] Failed to parse envelope from BroadcastChannel");
				return;
			}
			setPendingEnvelope(parsedEnvelope);
			void resolveTopicTarget(parsedEnvelope.topic_id).then((resolution) => {
				console.log("[Push] Topic resolution from BroadcastChannel:", resolution);
				if (!resolution) return;
				const payload = decryptPushEnvelope(parsedEnvelope, resolution.privateKey);
				if (!payload) return;
				const intent = {
					topicId: parsedEnvelope.topic_id,
					payload,
					identityId: resolution.identityId,
					sourceId: resolution.sourceId
				};
				console.log("[Push] Setting intent from BroadcastChannel:", intent);
				setIntent(intent);
				clearPendingEnvelope();
			});
		};
	}
}

console.log("yes it does live reload")

export function captureNativeEarly() {
	const platform = Capacitor.getPlatform();
	if (platform === "web") return;

	PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
		console.log("[Push] Native notification tapped:", action);
		const d: any = action.notification?.data.raw ?? {};
		const rawEnvelope = typeof d === "string"
			? d
			: typeof d?.push_envelope === "string"
				? d.push_envelope
				: null;
		const parsedEnvelope = rawEnvelope ? parseEnvelopeJsonString(rawEnvelope) : null;
		if (!parsedEnvelope) {
			console.warn("[Push] Failed to parse native notification data");
			return;
		}
		setPendingEnvelope(parsedEnvelope);
		void resolveTopicTarget(parsedEnvelope.topic_id).then((resolution) => {
			if (!resolution) return;
			const payload = decryptPushEnvelope(parsedEnvelope, resolution.privateKey);
			if (!payload) return;
			const intent = {
				topicId: parsedEnvelope.topic_id,
				payload,
				identityId: resolution.identityId,
				sourceId: resolution.sourceId
			};
			console.log("[Push] Parsed native intent:", intent);
			setIntent(intent);
			clearPendingEnvelope();
		});
	});
}
