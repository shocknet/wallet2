import { IonButton, useIonLoading } from "@ionic/react";
import { addNprofileSource, joinNodeWithInvite } from "@/State/scoped/backups/sources/thunks";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { NodeCard } from "../common/NodeCard";
import type { AddSourceCaseProps } from "../types";
import { flashOutline } from "ionicons/icons";


export function JoinNodeInviteCase({
	parsed,
	dismiss,
	inviteToken,
}: AddSourceCaseProps & { inviteToken?: string }) {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const [presentLoading, dismissLoading] = useIonLoading();

	const handleJoin = async () => {
		try {
			await presentLoading({ cssClass: "app-loading", message: "Joining…", backdropDismiss: false });
			if (inviteToken) {
				await dispatch(joinNodeWithInvite({
					lpk: parsed.pubkey,
					relays: parsed.relays,
					inviteToken,
				}));
			} else {
				dispatch(addNprofileSource({
					lpk: parsed.pubkey,
					relays: parsed.relays,
				}));
			}
			showToast({ color: "success", message: "Joined node", icon: flashOutline });
			dismiss(true, "confirm");
		} catch (err: unknown) {
			showToast({
				color: "danger",
				message: err instanceof Error ? err.message : "Failed to join node",
			});
			dismiss(null, "cancel");
		} finally {
			await dismissLoading();
		}
	};

	return (
		<div className="flex flex-col gap-2">
			<NodeCard parsed={parsed} />
			<p className="mt-5 text-base font-medium text-primary">
				You&apos;ve been invited
			</p>
			<p className="m-0 text-sm leading-5 text-muted">
				The owner of this node invites you to create an account here so
				you can send and receive on their Pub.
			</p>
			<div className="mt-12 flex justify-end gap-2">
				<IonButton color="medium" onClick={() => dismiss(null, "cancel")}>
					Cancel
				</IonButton>
				<IonButton color="primary" onClick={() => void handleJoin()}>
					Accept invite
				</IonButton>
			</div>
		</div>
	);
}
