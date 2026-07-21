import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
	hasPushParams,
	parseEnvelopeJsonString,
	parsePushEnvelopeFromPayload,
	parsePushEnvelopeFromUrl,
} from "@/notifications/push/helpers";
import { capturePushIntent } from "@/notifications/push/actions";
import { useAppDispatch } from "@/State/store/hooks";
import dLogger from "@/Api/helpers/debugLog";

const log = dLogger.withContext({ component: "push-capture" });

export function usePushCapture() {
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (Capacitor.isNativePlatform()) {
			const listener = PushNotifications.addListener(
				"pushNotificationActionPerformed",
				(action) => {
					const data = action.notification?.data;
					const rawEnvelope = typeof data?.raw === "string"
						? data.raw
						: typeof data === "string"
							? data
							: null;

					if (!rawEnvelope) {
						log.warn("native_no_raw_envelope", { data: { hasData: !!data } });
						return;
					}

					const parsedEnvelope = parseEnvelopeJsonString(rawEnvelope);
					if (parsedEnvelope) {
						dispatch(
							capturePushIntent({
								envelope: parsedEnvelope,
								source: `native-${Capacitor.getPlatform()}`,
							}),
						);
					}
				},
			);

			return () => {
				listener
					.then((handle) => handle.remove())
					.catch((err) => {
						log.error("native_push_capture_remove_error", { error: err });
					});
			};
		}

		const u = new URL(window.location.href);
		if (hasPushParams(u)) {
			const envelope = parsePushEnvelopeFromUrl(u);
			u.searchParams.delete("push");
			u.searchParams.delete("push_envelope");
			history.replaceState({}, "", u.toString());
			if (envelope) {
				dispatch(
					capturePushIntent({
						envelope,
						source: "web-cold-start",
					}),
				);
			}
		}

		const onMessage = (ev: MessageEvent) => {
			const parsedEnvelope = parsePushEnvelopeFromPayload(ev.data);
			if (parsedEnvelope) {
				dispatch(
					capturePushIntent({
						envelope: parsedEnvelope,
						source: "web-warm-start",
					}),
				);
			}
		};

		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener("message", onMessage);
			return () => {
				navigator.serviceWorker.removeEventListener("message", onMessage);
			};
		}
	}, [dispatch]);
}
