import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	runtimeActions,
	selectNotificationsPermission,
} from "@/State/runtime/slice";

import { refreshPushRegistration } from "@/notifications/push/register";

export function usePushRegistration() {
	const dispatch = useAppDispatch();
	const permission = useAppSelector(selectNotificationsPermission);


	useEffect(() => {
		dispatch(refreshPushRegistration()).catch((err) => {
			dispatch(runtimeActions.setPushRuntimeStatus({
				pushStatus: {
					status: "error",
					error: err instanceof Error ? err.message : "Unknown error when registering push notifications"
				}
			}));
		});

	}, [permission, dispatch]);
}
