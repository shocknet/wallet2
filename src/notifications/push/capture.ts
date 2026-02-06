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
			console.log("[Push] Service worker message:", event.data);
			const d = event.data;
			const parsedEnvelope = parsePushEnvelopeFromPayload(d);
			console.log({ parsedEnvelope });
			if (!parsedEnvelope) return;
			setPendingEnvelope(parsedEnvelope);
			void resolveTopicTarget(parsedEnvelope.topic_id).then((resolution) => {
				console.log({ resolution });
				if (!resolution) return;
				const payload = decryptPushEnvelope(parsedEnvelope, resolution.privateKey);
				if (!payload) return;
				const intent = {
					topicId: parsedEnvelope.topic_id,
					payload,
					identityId: resolution.identityId,
					sourceId: resolution.sourceId
				};
				console.log("[Push] Parsed intent from service worker:", intent);
				setIntent(intent);
				clearPendingEnvelope();
			});
		});
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
