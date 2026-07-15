import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonModal,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { closeOutline, lockOpenOutline, trashOutline } from "ionicons/icons";
import { useState } from "react";
import { nip19 } from "nostr-tools";
import type { Identity } from "@/State/identitiesRegistry/types";
import { deleteIdentity } from "@/State/identitiesRegistry/thunks";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { requestIdentityUnlock } from "@/shell/coordinator";
import type { UnlockReason } from "@/shell/types";
import { useAskPromptDecision } from "@/Components/Modals/PromptDecision";
import { useToast } from "@/lib/contexts/useToast";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { ProfileCard } from "./ProfileCard";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";

export function InactiveProfileSheet({
	identity,
	isOpen,
	onDidDismiss,
	unlockReason = "user-selected",
}: {
	identity: Identity | null;
	isOpen: boolean;
	onDidDismiss: () => void;
	unlockReason?: UnlockReason;
}) {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const presentPromptDecision = useAskPromptDecision();
	const activeIdentityId = useAppSelector(selectActiveIdentity)?.pubkey ?? null;
	const [busy, setBusy] = useState<"unlock" | "delete" | null>(null);

	const canDelete =
		!!identity && identity.pubkey !== activeIdentityId;
	const npub = identity ? nip19.npubEncode(identity.pubkey) : "";
	const unlockLabel = activeIdentityId
		? "Switch to this profile"
		: "Unlock";

	async function handleUnlock() {
		if (!identity || busy) return;
		setBusy("unlock");
		try {
			onDidDismiss();
			requestIdentityUnlock(dispatch, {
				identityId: identity.pubkey,
				reason: unlockReason,
			});
		} finally {
			setBusy(null);
		}
	}

	async function handleDelete() {
		if (!identity || !canDelete || busy) return;

		const confirmed = await presentPromptDecision({
			title: "Remove profile?",
			description:
				"This removes the profile from this device. If you do not have a backup, you may lose access to funds for this profile.",
			confirmButtonLabel: "Remove",
			confirmButtonColor: "danger",
			denyButtonLabel: "Cancel",
		});

		if (!confirmed) return;

		setBusy("delete");
		try {
			await dispatch(deleteIdentity(identity.pubkey));
			onDidDismiss();
		} catch (err: unknown) {
			showToast({
				color: "danger",
				message:
					err instanceof Error
						? err.message
						: "Could not remove profile",
			});
		} finally {
			setBusy(null);
		}
	}

	return (
		<IonModal
			isOpen={isOpen && !!identity}
			onDidDismiss={onDidDismiss}
			initialBreakpoint={0.92}
			breakpoints={[0, 0.92, 1]}
			expandToScroll={false}
			handle
			className="inactive-profile-sheet"
		>
			{identity ? (
				<>
					<IonHeader className="ion-no-border">
						<IonToolbar>
							<IonTitle>Profile</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={onDidDismiss}>
									<IonIcon icon={closeOutline} slot="icon-only" />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>

					<IonContent className="ion-padding" scrollY={false}>
						<div className="mx-auto flex h-full w-full max-w-md flex-col">
							<ProfileCard
								identity={identity}
								className="shrink-0"
							/>

							<div className="mt-3 flex shrink-0 items-center justify-center gap-1">
								<span className="font-mono text-xs text-faint break-all text-center">
									{npub}
								</span>
								<CopyMorphButton
									value={npub}
									fill="clear"
									size="small"
									shape="round"
								/>
							</div>

							<div className="mt-6 flex shrink-0 flex-col gap-2 pb-2">
								<IonButton
									expand="block"
									size="large"
									color="primary"
									className="[--border-radius:12px]"
									disabled={busy !== null}
									onClick={() => void handleUnlock()}
								>
									{busy === "unlock" ? (
										<IonSpinner
											name="crescent"
											className="h-5 w-5"
										/>
									) : (
										<>
											<IonIcon
												slot="start"
												icon={lockOpenOutline}
											/>
											{unlockLabel}
										</>
									)}
								</IonButton>

								{canDelete ? (
									<IonButton
										expand="block"
										size="large"
										fill="outline"
										color="danger"
										className="[--border-radius:12px]"
										disabled={busy !== null}
										onClick={() => void handleDelete()}
									>
										{busy === "delete" ? (
											<IonSpinner
												name="crescent"
												className="h-5 w-5"
											/>
										) : (
											<>
												<IonIcon
													slot="start"
													icon={trashOutline}
												/>
												Remove from this device
											</>
										)}
									</IonButton>
								) : null}
							</div>
						</div>
					</IonContent>
				</>
			) : null}
		</IonModal>
	);
}
