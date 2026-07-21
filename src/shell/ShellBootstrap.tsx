import { useEffect, useRef } from "react";
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
		void dispatch(startShell());
	}, [dispatch]);

	return null;
}
