import { selectPendingIntent } from "@/shell/selectors";
import { shellActions } from "@/shell/slice";
import {
	isAddSourceIntent,
	isNavigateIntent,
	isOpenOperationIntent,
	isSendIntent,
	isSweepIntent,
} from "@/intents/types";

import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { useSweepLnurlwModal } from "@/Components/Modals/SweepLnurlwModal";
import { useAddSourceIntentModal } from "@/Pages/Sources/AddSourceModal";
import { useOverlayCoordinator, isDismissed } from "@/overlay";
import { navToSend } from "@/Pages/Send/nav";
import { navToHome } from "@/Pages/Home/nav";

export function useConsumePendingIntent() {
	const history = useHistory();
	const dispatch = useAppDispatch();
	const pendingIntent = useAppSelector(selectPendingIntent);
	const activeIdentity = useAppSelector(selectActiveIdentity)!;
	const askSweepLnurlw = useSweepLnurlwModal();
	const askAddSourceIntent = useAddSourceIntentModal();
	const { occupied } = useOverlayCoordinator();
	const presentingIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (
			!pendingIntent
			|| (pendingIntent.identityId && pendingIntent.identityId !== activeIdentity.pubkey)
		) {
			return;
		}

		if (occupied) return;

		if (isAddSourceIntent(pendingIntent)) {
			if (presentingIdRef.current === pendingIntent.id) return;
			presentingIdRef.current = pendingIntent.id;
			const { id } = pendingIntent;
			void askAddSourceIntent({
				initialNprofile: pendingIntent.nprofile,
				integrationData: pendingIntent.integrationData,
				invitationToken: pendingIntent.invitationToken,
				fromInviteUrl: pendingIntent.fromUrl,
			}).then((outcome) => {
				if (presentingIdRef.current === id) {
					presentingIdRef.current = null;
				}
				if (!isDismissed(outcome)) return;
				dispatch(shellActions.pendingIntentCleared({ id }));
			});
			return;
		}

		if (isSweepIntent(pendingIntent)) {
			if (presentingIdRef.current === pendingIntent.id) return;
			presentingIdRef.current = pendingIntent.id;
			const { id, parsed } = pendingIntent;
			void askSweepLnurlw(parsed).then((outcome) => {
				if (presentingIdRef.current === id) {
					presentingIdRef.current = null;
				}
				if (isDismissed(outcome)) {
					dispatch(shellActions.pendingIntentCleared({ id }));
				}
			});
			return;
		}

		if (isSendIntent(pendingIntent)) {
			navToSend(history, { parsed: pendingIntent.parsed });
			dispatch(shellActions.pendingIntentCleared({ id: pendingIntent.id }));
			return;
		}

		if (isOpenOperationIntent(pendingIntent)) {
			navToHome(history, {
				notif_op_id: pendingIntent.operationId,
				sourceId: pendingIntent.sourceId,
			});
			dispatch(shellActions.pendingIntentCleared({ id: pendingIntent.id }));
			return;
		}

		if (isNavigateIntent(pendingIntent)) {
			history.push(pendingIntent.path);
			dispatch(shellActions.pendingIntentCleared({ id: pendingIntent.id }));
		}
	}, [
		pendingIntent,
		activeIdentity,
		history,
		dispatch,
		askSweepLnurlw,
		askAddSourceIntent,
		occupied,
	]);
}
