import { LocalNotifications } from "@capacitor/local-notifications";
import { Satoshi } from "./types/units";
import { formatSatoshi } from "./units";
import { isPlatform } from "@ionic/react";

const NOTIFICATION_CHANNELS = {
	OPERATIONS: 'payment_operations',
	ALERTS: 'wallet_alerts',
} as const;

export async function initLocalNotifications(): Promise<boolean> {
	try {
		// First permission request
		let { display } = await LocalNotifications.checkPermissions();


		if (display === "granted") {
			await setUpAndroidNotificationChannel();
			return true;
		}

		if (display === "prompt") {
			({ display } = await LocalNotifications.requestPermissions());
			if (display === "granted") {
				await setUpAndroidNotificationChannel();
				return true;
			}
			return false;
		}

		return false;

	} catch (err) {
		console.error("Error initializing notifications", err);
		return false;
	}
}

async function setUpAndroidNotificationChannel() {
	if (isPlatform("android")) {
		await LocalNotifications.createChannel({
			id: NOTIFICATION_CHANNELS.OPERATIONS,
			name: "Wallet Operations",
			description: "Transaction notifications",
			importance: 4,
			visibility: 1,
			vibration: true
		});
	}
}


async function showOperationNotification(
	title: string,
	body: string,
	summaryText: string,
	largeIcon: string,
	operationId: string,
) {


	try {
		await LocalNotifications.schedule({
			notifications: [
				{
					id: Math.floor(Math.random() * 10000),
					title,
					body,
					channelId: NOTIFICATION_CHANNELS.OPERATIONS,
					largeBody: body,
					summaryText: summaryText,
					largeIcon: largeIcon,
					extra: {
						operationId,
					}
				}
			]
		});


	} catch (err) {
		console.error("Error showing notification", err);
	}
}



export async function notifyReceivedOperation(amount: Satoshi, operationId: string, isOnChain: boolean) {
	return showOperationNotification(
		"Payment Received",
		`You Received ${formatSatoshi(amount)} sats`,
		isOnChain ? "Incoming on-chain transaction" : "Incoming Lightning transaction",
		"ic_notification",
		operationId
	)
}

export function notifySentOperation(amount: Satoshi, operationId: string, isOnChain: boolean) {
	return showOperationNotification(
		"Payment Sent",
		`You sent ${formatSatoshi(amount)} sats`,
		isOnChain ? "Outgoing on-chain transaction" : "Outgoing Lightning transaction",
		"ic_notification",
		operationId
	)
}