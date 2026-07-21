import { selectTopicIndexFromRegistry } from "@/State/identitiesRegistry/slice";
import { requestIdentityUnlock } from "@/shell/coordinator";
import { materializePushIntentToPendingNav } from "@/shell/pendingNav";
import { selectPushIntent } from "@/shell/selectors";
import { shellActions } from "@/shell/slice";
import { RuntimeIdentity } from "@/shell/types";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { RootState } from "@/State/store/store";
import { useEffect, useRef } from "react";
import { useStore } from "react-redux";

export function useHandleWarmPushTap(runtimeIdentity: RuntimeIdentity) {
	const dispatch = useAppDispatch();
	const store = useStore<RootState>();
	const pushIntent = useAppSelector(selectPushIntent);
	const handledPushAtRef = useRef<number | null>(null);

	useEffect(() => {
		if (!pushIntent) {
			handledPushAtRef.current = null;
			return;
		}

		if (handledPushAtRef.current === pushIntent.receivedAtMs) {
			return;
		}

		const topicEntry = selectTopicIndexFromRegistry(
			store.getState(),
			pushIntent.envelope.topic_id,
		);

		if (!topicEntry) {
			handledPushAtRef.current = pushIntent.receivedAtMs;
			dispatch(shellActions.pushIntentCleared());
			return;
		}

		handledPushAtRef.current = pushIntent.receivedAtMs;

		if (topicEntry.identityId === runtimeIdentity.pubkey) {
			dispatch(materializePushIntentToPendingNav());
			return;
		}

		dispatch(
			requestIdentityUnlock({
				identityId: topicEntry.identityId,
				reason: "push-intent",
			}),
		);
	}, [
		pushIntent,
		runtimeIdentity.pubkey,
		dispatch,
		store,
	]);
}
