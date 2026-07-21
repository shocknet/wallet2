import { useEffect } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { selectNotificationsPermission } from "@/State/runtime/slice";
import { ensureLocalNotificationChannels } from "@/notifications/local/channels";

export function useLocalNotificationsSetup() {
	const permission = useAppSelector(selectNotificationsPermission);

	useEffect(() => {
		if (permission !== "granted") return;
		ensureLocalNotificationChannels();
	}, [permission]);
}
