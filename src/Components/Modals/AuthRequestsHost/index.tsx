import { useCallback, useRef } from "react";
import { IonModal } from "@ionic/react";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import ManageAuthRequest from "./Manage";
import type { DebitDismissRole } from "./types";
import DebitAuthRequest from "./Debit";
import { selectPendingClinkRequestSession } from "@/State/clinkRequests/selectors";
import { clinkRequestsActions } from "@/State/clinkRequests/slice";


export type { DebitDismissRole } from "./types";

const DISMISS_ROLES: DebitDismissRole[] = ["allow", "deny", "ban", "dismiss"];

/*
 * Host for debit / manage auth sessions.
 * clear session in onDidDismiss.
 */
function AuthRequestsHost() {
	const dispatch = useAppDispatch();
	const session = useAppSelector(selectPendingClinkRequestSession);
	const modalRef = useRef<HTMLIonModalElement>(null);

	const dismissWithRole = useCallback(async (role: DebitDismissRole) => {
		await modalRef.current?.dismiss(null, role);
	}, []);

	const canDismiss = useCallback(async (_data?: unknown, role?: string) => {
		return DISMISS_ROLES.includes(role as DebitDismissRole);
	}, []);

	const handleDidDismiss = useCallback(() => {
		dispatch(clinkRequestsActions.clearPendingClinkRequestSession());
	}, [dispatch]);

	return (
		<IonModal
			ref={modalRef}
			className="wallet-modal"
			isOpen={session !== null}
			backdropDismiss={false}
			canDismiss={canDismiss}
			onDidDismiss={handleDidDismiss}
		>
			{session?.kind === "debit" ? (
				<DebitAuthRequest
					key={`debit:${session.request.request_id}`}
					session={session}
					dismissWithRole={dismissWithRole}
				/>
			) : null}
			{session?.kind === "manage" ? (
				<ManageAuthRequest
					key={`manage:${session.request.request_id}`}
					session={session}
					dismissWithRole={dismissWithRole}
				/>
			) : null}
		</IonModal>
	);
}

export default AuthRequestsHost;
