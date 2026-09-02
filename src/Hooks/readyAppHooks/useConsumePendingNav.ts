import { selectPendingNav } from "@/shell/selectors";
import { shellActions } from "@/shell/slice";
import { isSweepLnurlwPendingNav } from "@/shell/pendingNavTypes";

import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { useIonRouter } from "@ionic/react";
import { useEffect } from "react";
import { useAskSweepLnurlw } from "@/Components/Modals/SweepLnurlwModal";

export function useConsumePendingNav() {
	const router = useIonRouter();
	const dispatch = useAppDispatch();
	const pendingNav = useAppSelector(selectPendingNav);
	const activeIdentity = useAppSelector(selectActiveIdentity)!;
	const askSweepLnurlw = useAskSweepLnurlw();


	useEffect(() => {
		if (
			!pendingNav
			|| (pendingNav.identityId && pendingNav.identityId !== activeIdentity.pubkey)
		) {
			return;
		}

		if (isSweepLnurlwPendingNav(pendingNav)) {
			const parsed = pendingNav.parsed;
			dispatch(shellActions.pendingNavCleared());
			void askSweepLnurlw(parsed);
			return;
		}

		router.push(
			pendingNav.path,
			"root",
			pendingNav.path === "/bootstrap" ? "replace" : "push",
			pendingNav.state as Record<string, unknown> | undefined,
		);

		dispatch(shellActions.pendingNavCleared());
	}, [pendingNav, activeIdentity, router, dispatch, askSweepLnurlw]);
}
