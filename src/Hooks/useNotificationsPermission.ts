import { useCallback, useEffect } from "react";
import {
	getNotificationsPermission,
	requestNotificationsPermission,
	type NotificationsPermission,
} from "@/notifications/permission";
import {
	runtimeActions,
	selectNotificationsPermission,
} from "@/State/runtime/slice";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";

export function useNotificationsPermission() {
	const dispatch = useAppDispatch();
	const permission = useAppSelector(selectNotificationsPermission);

	const refreshPermission = useCallback(async (): Promise<NotificationsPermission> => {
		const next = await getNotificationsPermission();
		dispatch(runtimeActions.setNotificationsPermission({ permission: next }));
		return next;
	}, [dispatch]);

	const requestPermission = useCallback(async (): Promise<NotificationsPermission> => {
		const next = await requestNotificationsPermission();
		dispatch(runtimeActions.setNotificationsPermission({ permission: next }));
		return next;
	}, [dispatch]);

	useEffect(() => {
		void refreshPermission();
	}, [refreshPermission]);

	return {
		permission,
		refreshPermission,
		requestPermission,
	};
}
