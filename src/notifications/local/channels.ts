import { LocalNotifications } from "@capacitor/local-notifications";
import { isPlatform } from "@ionic/react";
import dLogger from "@/Api/helpers/debugLog";

const log = dLogger.withContext({ component: "local-notif-channels" });

export const NOTIFICATION_CHANNELS = {
	OPERATIONS: "payment_operations",
	ALERTS: "wallet_alerts",
} as const;

export async function ensureLocalNotificationChannels(): Promise<void> {
	try {
		if (!isPlatform("android")) return;

		await LocalNotifications.createChannel({
			id: NOTIFICATION_CHANNELS.OPERATIONS,
			name: "Wallet Operations",
			description: "Transaction notifications",
			importance: 4,
			visibility: 1,
			vibration: true,
		});
	} catch (err) {
		log.error("channels_setup_error", { error: err });
	}
}
