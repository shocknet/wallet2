import { selectPendingNav } from "@/shell/selectors";
import { shellActions } from "@/shell/slice";
import { RuntimeIdentity } from "@/shell/types";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { useIonRouter } from "@ionic/react";
import { useEffect } from "react";

export function useConsumePendingNav(activeIdentity: RuntimeIdentity) {
	const router = useIonRouter();
	const dispatch = useAppDispatch();
	const pendingNav = useAppSelector(selectPendingNav);


	useEffect(() => {
		if (
			!pendingNav
			|| (pendingNav.identityId && pendingNav.identityId !== activeIdentity.pubkey)
		) {
			return;
		}

		router.push(
			pendingNav.path,
			"root",
			pendingNav.path === "/bootstrap" ? "replace" : "push",
			pendingNav.state as Record<string, unknown> | undefined,
		);

		dispatch(shellActions.pendingNavCleared());
	}, [pendingNav, activeIdentity, router, dispatch]);
}
