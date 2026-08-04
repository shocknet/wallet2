import { useState } from "react";
import { IonButton, IonContent, IonFooter, IonIcon, IonToolbar } from "@ionic/react";
import { closeOutline, shieldCheckmarkOutline } from "ionicons/icons";
import { BanPrompt } from "../shared";
import { useManageActions, type ManageAuthProps } from "./useManageActions";
import { ClinkRequestIdentityView } from "@/Components/ClinkRequests/ClinkRequestIdentityView";

export function ManageAuthRequestView({
	session,
	dismissWithRole,
}: ManageAuthProps) {
	const { busy, denyOnly, ban, authorize } = useManageActions(
		session,
		dismissWithRole,
	);
	const [phase, setPhase] = useState<"decision" | "banPrompt">("decision");

	if (phase === "banPrompt") {
		return (
			<BanPrompt
				busy={busy}
				onBan={ban}
				onDenyOnly={denyOnly}
				onBack={() => setPhase("decision")}
			/>
		);
	}

	return (
		<>
			<IonContent className="ion-padding">
				<div className="mx-auto flex min-h-full w-full min-w-0 max-w-md flex-col items-center justify-center gap-2">
					<ClinkRequestIdentityView
						pubkey={session.request.npub}
						relays={session.source.relays}
					/>

					<div className="flex flex-col items-center gap-4 text-center">
						<p className="m-0 text-sm font-medium tracking-wide text-[var(--ion-color-warning)]">
							Wants to manage your offers
						</p>

						<p className="m-0 max-w-sm text-sm text-muted">
							Allow lets this app create, update, and delete offers on this
							source. You can revoke access later in Management.
						</p>
					</div>
				</div>
			</IonContent>
			<IonFooter>
				<IonToolbar>
					<div className="grid grid-cols-2 gap-3 px-3 pb-3 pt-2">
						<IonButton
							expand="block"
							fill="outline"
							color="medium"
							disabled={busy}
							onClick={() => setPhase("banPrompt")}
						>
							<IonIcon icon={closeOutline} slot="start" />
							Deny
						</IonButton>
						<IonButton
							expand="block"
							disabled={busy}
							onClick={authorize}
						>
							<IonIcon icon={shieldCheckmarkOutline} slot="start" />
							Allow
						</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>
		</>
	);
}
