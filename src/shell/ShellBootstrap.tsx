import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/State/store/hooks";
import { startShell } from "./coordinator";
import { refreshPushRegistration } from "@/notifications/push/register";

export function ShellBootstrap() {
	const dispatch = useAppDispatch();
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) {
			return;
		}

		startedRef.current = true;
		void dispatch(refreshPushRegistration());
		void dispatch(startShell());
	}, [dispatch]);

	return null;
}
