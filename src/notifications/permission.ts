import { LocalNotifications } from "@capacitor/local-notifications";

export type NotificationsPermission = "prompt" | "granted" | "denied";

export async function getNotificationsPermission(): Promise<NotificationsPermission> {
	const { display } = await LocalNotifications.checkPermissions();
	return display === "prompt-with-rationale" ? "prompt" : display;
}

export async function requestNotificationsPermission(): Promise<NotificationsPermission> {
	const { display } = await LocalNotifications.requestPermissions();
	return display === "prompt-with-rationale" ? "prompt" : display;
}

