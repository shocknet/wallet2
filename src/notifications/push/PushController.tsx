import { useEffect } from "react";
import { useIonRouter } from "@ionic/react";
import { onIntent, clearIntent, markReady, type PushActionData } from "@/notifications/push/intentBus";
import { setPendingNav } from "@/notifications/push/pendingNav";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
import { switchIdentity } from "@/State/identitiesRegistry/thunks";

type RouteIntent = {
	path: string;
	state?: any;
};

function routeForIntent(i: { actionData?: PushActionData }): RouteIntent {
	if (i.actionData?.action_type === "payment-received" || i.actionData?.action_type === "payment-sent") {
		return {
			path: "/home",
			state: {
				notif_op_id: i.actionData.notif_op_id
			}
		};
	}
	return { path: "/home" };
}

export function PushIntentController() {
	const ionRouter = useIonRouter();
	const dispatch = useAppDispatch();
	const activeIdentityId = useAppSelector(selectActiveIdentityId);

	useEffect(() => {
		const unsubscribe = onIntent(async (intent) => {
			console.log("[PushController] Handling push intent:", intent);
			const targetRoute = routeForIntent(intent);


			const targetIdentity =
				intent.identityHint ?? null;


			if (!targetIdentity) {
				ionRouter.push("/notify", "root", "replace");
				clearIntent();
				return;
			}

			if (targetIdentity !== activeIdentityId) {
				setPendingNav({
					path: targetRoute.path,
					state: targetRoute.state,
					identityId: targetIdentity
				});
				clearIntent();
				await dispatch(switchIdentity(targetIdentity, true));
				return;
			}

			ionRouter.push(targetRoute.path, "root", "replace", targetRoute.state);
			clearIntent();
		});
		markReady();
		return unsubscribe;
	}, [dispatch, ionRouter, activeIdentityId]);

	return null;
}
