import { LocalNotifications } from "@capacitor/local-notifications";
import { Satoshi } from "./types/units";
import { formatSatoshi } from "./units";
import { isPlatform } from "@ionic/react";
import type { AlertOptions, AlertResult } from "./contexts/useAlert";
import { Preferences } from "@capacitor/preferences";

const DENIED_NOTIFICATIONS_PERMISSIONS = "notif_perms_denied";

const NOTIFICATION_CHANNELS = {
	OPERATIONS: 'payment_operations',
	ALERTS: 'wallet_alerts',
} as const;
export async function checkNotifPerms() {
	return LocalNotifications.checkPermissions();
}


let inflight = false;


export async function initLocalNotifications(
	showAlert: (options: AlertOptions) => Promise<AlertResult>,
) {
	try {
		// First permission request
		const { display } = await LocalNotifications.checkPermissions();



		if (display === "granted") {
			await setUpAndroidNotificationChannel();
			return;
		}

		if ((display === "prompt" || display === "prompt-with-rationale") && !inflight) {
			showAlert({
				header: "Notifications permission required",
				message: "We would like notifications permissions to notify you about transactions",
				onWillPresent: () => inflight = true,
				onWillDismiss: () => inflight = false,
				buttons: [
					{
						text: "Deny",
						role: "cancel",
						cssClass: "alert-button-cancel"
					},
					{
						text: "Allow",
						role: "confirm",
						cssClass: "alert-button-confirm",
						handler: () => {
							setupNotifications();
						}
					}
				]
			});

			return;
		}

		const { value } = await Preferences.get({ key: DENIED_NOTIFICATIONS_PERMISSIONS });

		if (display === "denied" && !value) {
			showAlert({
				header: "Notifications Disabled",
				message: !isPlatform("hybrid")
					? 'You have blocked notifications in your browser. Please enable them in your browser settings if you wish to receive notifications.'
					: 'Notifications are disabled. Please enable them in your device settings to receive alerts.',
				buttons: ['OK']
			});

			Preferences.set({
				key: DENIED_NOTIFICATIONS_PERMISSIONS,
				value: JSON.stringify(true)
			});

			return true;
		}

	} catch (err) {
		console.error("Error initializing notifications", err);
	}
}


async function setupNotifications(): Promise<boolean> {
	const { display } = await LocalNotifications.requestPermissions();
	if (display === "granted") {
		await setUpAndroidNotificationChannel();
		return true;
	}
	return false;
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
		operationId
	)
}

export function notifySentOperation(amount: Satoshi, operationId: string, isOnChain: boolean) {
	return showOperationNotification(
		"Payment Sent",
		`You sent ${formatSatoshi(amount)} sats`,
		isOnChain ? "Outgoing on-chain transaction" : "Outgoing Lightning transaction",
		operationId
	)
}
