import { Capacitor } from "@capacitor/core";
import {
	setIntent,
	parseEnvelopeJsonString,
	decryptPushEnvelope,
	setPendingEnvelope,
	clearPendingEnvelope
} from "./intentBus";
import { PushNotifications } from "@capacitor/push-notifications";
import { resolveTopicTarget } from "./topicResolver";
import { getPendingEnvelope, clearPendingEnvelope as clearStoredEnvelope } from "./envelopeStore";
import { App } from "@capacitor/app";

async function processEnvelope(envelope: any) {
	console.log("[Push] Processing envelope:", envelope);
	setPendingEnvelope(envelope);
	const resolution = await resolveTopicTarget(envelope.topic_id);
	if (!resolution) {
		console.log("[Push] No resolution for envelope");
		return;
	}
	const payload = decryptPushEnvelope(envelope, resolution.privateKey);
	if (!payload) {
		console.log("[Push] Failed to decrypt envelope");
		return;
	}
	setIntent({
		topicId: envelope.topic_id,
		payload,
		identityId: resolution.identityId,
		sourceId: resolution.sourceId
	});
	clearPendingEnvelope();
}

async function checkIndexedDBForEnvelope() {
	console.log("[Push] Checking IndexedDB for pending envelope");
	const envelope = await getPendingEnvelope();

	if (envelope) {
		console.log("[Push] Found envelope in IndexedDB");
		await processEnvelope(envelope);
		await clearStoredEnvelope();
	} else {
		console.log("[Push] No pending envelope in IndexedDB");
	}
}

export function captureWebEarly() {
	// Check IndexedDB immediately on cold start
	void checkIndexedDBForEnvelope();

	// Listen for app resume (warm start when SW focuses the window)
	App.addListener("resume", () => {
		console.log("[Push] App resumed (web), checking IndexedDB");
		void checkIndexedDBForEnvelope();
	});
}

export function captureNativeEarly() {
	const platform = Capacitor.getPlatform();
	if (platform === "web") return;

	// Native notifications include data directly in the tap event
	PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
		console.log("[Push] Native notification tapped:", action);
		const d: any = action.notification?.data ?? {};
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
		void processEnvelope(parsedEnvelope);
	});
}
