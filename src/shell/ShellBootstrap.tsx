import { useEffect, useRef } from "react";
import store from "@/State/store/store";
import { useAppDispatch } from "@/State/store/hooks";
import { startShell } from "./coordinator";
export function ShellBootstrap() {
	const dispatch = useAppDispatch();
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) {
			return;
		}

		startedRef.current = true;
		startShell(dispatch, store.getState);
	}, [dispatch]);

	return null;
}
