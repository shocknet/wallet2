import { LocalNotifications } from "@capacitor/local-notifications";
import { toastController } from "@ionic/core";
import { Satoshi } from "@/lib/types/units";
import { formatSatoshi } from "@/lib/units";
import dLogger from "@/Api/helpers/debugLog";
import { NOTIFICATION_CHANNELS } from "./channels";

const log = dLogger.withContext({ component: "local-notif-display" });

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
					summaryText,
					extra: {
						operationId,
					},
				},
			],
		});
	} catch (err) {
		log.error("show_notification_error", { error: err });
	}
}

export async function notifyReceivedOperation(
	amount: Satoshi,
	operationId: string,
	isOnChain: boolean,
) {
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
		operationId,
	);
}

export function notifySentOperation(
	amount: Satoshi,
	operationId: string,
	isOnChain: boolean,
) {
	return showOperationNotification(
		"Payment Sent",
		`You sent ${formatSatoshi(amount)} sats`,
		isOnChain ? "Outgoing on-chain transaction" : "Outgoing Lightning transaction",
		operationId,
	);
}
