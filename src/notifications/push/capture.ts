import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import store from "@/State/store/store";
import dLogger from "@/Api/helpers/debugLog";
import { capturePushIntent } from "./actions";
import {
	hasPushParams,
	parseEnvelopeJsonString,
	parsePushEnvelopeFromPayload,
	parsePushEnvelopeFromUrl,
} from "./helpers";

const log = dLogger.withContext({ component: "push-capture" });

let started = false;


export function startPushCapture() {
	if (started) {
		return;
	}
	started = true;

	if (Capacitor.isNativePlatform()) {
		captureNative();
	} else {
		captureWeb();
	}
}

function captureWeb() {
	const u = new URL(window.location.href);
	if (hasPushParams(u)) {
		const envelope = parsePushEnvelopeFromUrl(u);
		u.searchParams.delete("push");
		u.searchParams.delete("push_envelope");
		history.replaceState({}, "", u.toString());
		if (envelope) {
			store.dispatch(
				capturePushIntent({
					envelope,
					source: "web-cold-start",
				}),
			);
		}
	}

	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.addEventListener("message", (ev) => {
			console.log({ ev });
			const parsedEnvelope = parsePushEnvelopeFromPayload(ev.data);
			if (parsedEnvelope) {
				store.dispatch(
					capturePushIntent({
						envelope: parsedEnvelope,
						source: "web-warm-start",
					}),
				);
			}
		});
	}
}

function captureNative() {
	void PushNotifications.addListener(
		"pushNotificationActionPerformed",
		(action) => {
			const data = action.notification?.data as
				| Record<string, unknown>
				| string
				| undefined;
			const rawEnvelope =
				typeof data === "object" &&
					data !== null &&
					typeof data.raw === "string"
					? data.raw
					: typeof data === "string"
						? data
						: null;

			if (!rawEnvelope) {
				log.warn("native_no_raw_envelope", {
					data: { hasData: !!data },
				});
				return;
			}

			const parsedEnvelope = parseEnvelopeJsonString(rawEnvelope);
			if (parsedEnvelope) {
				store.dispatch(
					capturePushIntent({
						envelope: parsedEnvelope,
						source: `native-${Capacitor.getPlatform()}`,
					}),
				);
			}
		},
	).catch((err) => {
		started = false;
		log.error("native_push_capture_arm_error", { error: err });
	});
}
