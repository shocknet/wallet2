import { useCallback, useState } from "react";
import {
	authorizePendingManageRequest,
	banPendingManageRequest,
	ClinkAuthThunkResult,
	denyPendingManageRequest,
} from "@/State/clinkRequests/thunks";
import { useAppDispatch } from "@/State/store/hooks";
import { useToast } from "@/lib/contexts/useToast";
import type { DebitDismissRole } from "../types";
import { PendingClinkManageSession } from "@/State/clinkRequests/types";

export type ManageAuthProps = {
	session: PendingClinkManageSession;
	dismissWithRole: (role: DebitDismissRole) => Promise<void>;
};



export function useManageActions(
	session: PendingClinkManageSession,
	dismissWithRole: (role: DebitDismissRole) => Promise<void>,
) {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const [busy, setBusy] = useState(false);

	const runAction = useCallback(
		async (
			role: DebitDismissRole,
			action: () => Promise<ClinkAuthThunkResult> | ClinkAuthThunkResult,
			options?: { successToast?: string; },
		) => {
			if (busy) {
				return;
			}
			setBusy(true);
			try {
				const result = await action();
				if (!result.ok) {
					showToast({ message: result.reason, color: "danger" });
				} else if (options?.successToast) {
					showToast({ message: options?.successToast, color: "success" });
				}
				await dismissWithRole(role);
			} finally {
				setBusy(false);
			}
		},
		[busy, dismissWithRole, showToast],
	);

	const denyOnly = useCallback(() => {
		void runAction(
			"deny",
			() => dispatch(denyPendingManageRequest(session)),
			{ successToast: "Offer management denied" },
		);
	}, [dispatch, session, runAction]);

	const ban = useCallback(() => {
		void runAction(
			"ban",
			() => dispatch(banPendingManageRequest(session)),
			{ successToast: "Requestor banned from issuing future requests" },
		);
	}, [dispatch, session, runAction]);

	const authorize = useCallback(() => {
		void runAction(
			"allow",
			() => dispatch(authorizePendingManageRequest(session)),
			{ successToast: "Offer management authorized" },
		);
	}, [dispatch, session, runAction]);

	return { busy, denyOnly, ban, authorize };
}
