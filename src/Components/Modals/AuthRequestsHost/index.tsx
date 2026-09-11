import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import ManageAuthRequest from "./Manage";
import type { DebitDismissRole } from "./types";
import DebitAuthRequest from "./Debit";
import { selectPendingClinkRequestSession } from "@/State/clinkRequests/selectors";
import { clinkRequestsActions } from "@/State/clinkRequests/slice";
import {
	allowOverlayRoles,
	useOverlayCoordinator,
	type Dismiss,
	type OverlayResult,
	type OverlayOptions,
} from "@/overlay";

export type { DebitDismissRole } from "./types";

const lockedAuthOverlay: OverlayOptions = {
	cssClass: "wallet-modal",
	backdropDismiss: false,
	keyboardClose: false,
	canDismiss: allowOverlayRoles("allow", "deny", "ban", "dismiss"),
};

function AuthRequestOverlay({
	dismiss,
}: {
	dismiss: Dismiss<OverlayResult<DebitDismissRole>>;
}) {
	const session = useAppSelector(selectPendingClinkRequestSession);
	const dismissWithRole = useCallback(
		async (role: DebitDismissRole) => {
			dismiss({ role });
		},
		[dismiss],
	);

	if (!session) {
		return null;
	}

	if (session.kind === "debit") {
		return (
			<DebitAuthRequest
				key={`debit:${session.request.request_id}`}
				session={session}
				dismissWithRole={dismissWithRole}
			/>
		);
	}

	return (
		<ManageAuthRequest
			key={`manage:${session.request.request_id}`}
			session={session}
			dismissWithRole={dismissWithRole}
		/>
	);
}

export function useAuthRequestsModal() {
	const dispatch = useAppDispatch();
	const session = useAppSelector(selectPendingClinkRequestSession);
	const { tryPresent, occupied } = useOverlayCoordinator();
	const presentingRef = useRef(false);
	const dismissRef = useRef<Dismiss<OverlayResult<DebitDismissRole>> | null>(null);
	const hasSession = session !== null;

	useEffect(() => {
		return () => {
			dismissRef.current?.({ role: "dismiss" });
		};
	}, []);

	useEffect(() => {
		if (hasSession) return;
		dismissRef.current?.({ role: "dismiss" });
	}, [hasSession]);

	useEffect(() => {
		if (!hasSession || presentingRef.current || occupied) {
			return;
		}

		presentingRef.current = true;
		void tryPresent<OverlayResult<DebitDismissRole>>(
			(dismiss) => {
				dismissRef.current = dismiss;
				return <AuthRequestOverlay dismiss={dismiss} />;
			},
			lockedAuthOverlay,
		).then((outcome) => {
			presentingRef.current = false;
			dismissRef.current = null;
			if (outcome.status === "skipped") {
				return;
			}
			dispatch(clinkRequestsActions.clearPendingClinkRequestSession());
		});
	}, [hasSession, occupied, tryPresent, dispatch]);
}
