import { LocalNotifications } from "@capacitor/local-notifications";
import { Satoshi } from "../../lib/types/units";
import { formatSatoshi } from "../../lib/units";
import { isPlatform } from "@ionic/react";
import { toastController } from "@ionic/core";
import { getNotificationsPermission } from "../permission";

const NOTIFICATION_CHANNELS = {
	OPERATIONS: 'payment_operations',
	ALERTS: 'wallet_alerts',
} as const;
export async function checkNotifPerms() {
	return LocalNotifications.checkPermissions();
}


export async function initLocalNotifications() {
	try {
		const perm = await getNotificationsPermission()
		if (perm === "granted") {
			await setUpAndroidNotificationChannel();
		}
	} catch (err) {
		console.error("Error initializing notifications", err);
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
	return;
	const toast = await toastController.create({
		message: "Payment received",
		color: "success",
		duration: 4000,
		position: "bottom",
	});
	await toast.present();
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
