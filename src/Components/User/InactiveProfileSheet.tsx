import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { closeOutline, lockOpenOutline, trashOutline } from "ionicons/icons";
import { useCallback, useState } from "react";
import { nip19 } from "nostr-tools";
import type { Identity } from "@/State/identitiesRegistry/types";
import { deleteIdentity } from "@/State/identitiesRegistry/thunks";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { requestIdentityUnlock } from "@/shell/coordinator";
import type { UnlockReason } from "@/shell/types";
import { useNestedPromptDangerModal } from "@/Components/prompt";
import { useToast } from "@/lib/contexts/useToast";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { ProfileCard } from "./ProfileCard";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import {
	useOverlayCoordinator,
	type Dismiss,
	type OverlayChoice,
	type OverlayOptions,
} from "@/overlay";

const sheetOverlay: OverlayOptions = {
	cssClass: "app-sheet-modal",
	initialBreakpoint: 0.92,
	breakpoints: [0, 0.92, 1],
	expandToScroll: false,
	handle: true,
};

export type InactiveProfileOptions = {
	identity: Identity;
	unlockReason?: UnlockReason;
};

type InactiveProfileSheetProps = InactiveProfileOptions & {
	dismiss: Dismiss<OverlayChoice>;
};

function InactiveProfileSheet({
	identity,
	unlockReason = "user-selected",
	dismiss,
}: InactiveProfileSheetProps) {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const promptDanger = useNestedPromptDangerModal();
	const activeIdentityId = useAppSelector(selectActiveIdentity)?.pubkey ?? null;
	const [busy, setBusy] = useState<"unlock" | "delete" | null>(null);

	const canDelete = identity.pubkey !== activeIdentityId;
	const npub = nip19.npubEncode(identity.pubkey);
	const unlockLabel = activeIdentityId
		? "Switch to this profile"
		: "Unlock";

	async function handleUnlock() {
		if (busy) return;
		setBusy("unlock");
		try {
			dismiss({ role: "cancel" });
			dispatch(
				requestIdentityUnlock({
					identityId: identity.pubkey,
					reason: unlockReason,
				}),
			);
		} finally {
			setBusy(null);
		}
	}

	async function handleDelete() {
		if (!canDelete || busy) return;

		const confirmed = await promptDanger({
			title: "Remove profile?",
			description:
				"This removes the profile from this device. If you do not have a backup, you may lose access to funds for this profile.",
			confirmButtonLabel: "Remove",
		});

		if (confirmed.role !== "confirm") return;

		setBusy("delete");
		try {
			await dispatch(deleteIdentity(identity.pubkey));
			dismiss({ role: "cancel" });
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
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>Profile</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss({ role: "cancel" })}>
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
	);
}

export function useInactiveProfileModal() {
	const { present } = useOverlayCoordinator();
	return useCallback((options: InactiveProfileOptions) => {
		return present<OverlayChoice>(
			(dismiss) => <InactiveProfileSheet {...options} dismiss={dismiss} />,
			sheetOverlay,
		);
	}, [present]);
}
