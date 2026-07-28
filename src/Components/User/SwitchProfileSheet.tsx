import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonList,
	IonModal,
	IonSpinner,
	IonTitle,
	IonToolbar,
	useIonRouter,
} from "@ionic/react";
import {
	chevronBackOutline,
	closeOutline,
	lockOpenOutline,
	trashOutline,
} from "ionicons/icons";
import { useMemo, useState } from "react";
import { nip19 } from "nostr-tools";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { identitiesSelectors, selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import type { Identity } from "@/State/identitiesRegistry/types";
import { deleteIdentity } from "@/State/identitiesRegistry/thunks";
import { ProfileCard } from "@/Components/User/ProfileCard";
import { InactiveProfileCard } from "@/Components/User/InactiveProfileCard";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { requestIdentityUnlock } from "@/shell/coordinator";
import { useAskPromptDecision } from "@/Components/Modals/PromptDecision";
import { useToast } from "@/lib/contexts/useToast";

// Picker + detail sheet for other profiles (excludes the active one)
export function SwitchProfileSheet({
	isOpen,
	onDidDismiss,
}: {
	isOpen: boolean;
	onDidDismiss: () => void;
}) {
	const dispatch = useAppDispatch();
	const router = useIonRouter();
	const { showToast } = useToast();
	const presentPromptDecision = useAskPromptDecision();
	const activeIdentityId = useAppSelector(selectActiveIdentity)?.pubkey ?? null;
	const all = useAppSelector(identitiesSelectors.selectAll);
	const others = useMemo(
		() => all.filter((identity) => identity.pubkey !== activeIdentityId),
		[all, activeIdentityId],
	);
	const [selected, setSelected] = useState<Identity | null>(null);
	const [busy, setBusy] = useState<"unlock" | "delete" | null>(null);

	function handleDismiss() {
		setSelected(null);
		setBusy(null);
		onDidDismiss();
	}

	async function handleUnlock(identity: Identity) {
		if (busy) return;
		setBusy("unlock");
		try {
			handleDismiss();
			dispatch(
				requestIdentityUnlock({
					identityId: identity.pubkey,
					reason: "user-selected",
				}),
			);
		} finally {
			setBusy(null);
		}
	}

	async function handleDelete(identity: Identity) {
		if (busy || identity.pubkey === activeIdentityId) return;

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
			setSelected(null);
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
			isOpen={isOpen}
			onDidDismiss={handleDismiss}
			initialBreakpoint={0.92}
			breakpoints={[0, 0.92, 1]}
			expandToScroll={false}
			handle
			className="inactive-profile-sheet"
		>
			{selected ? (
				<>
					<IonHeader className="ion-no-border">
						<IonToolbar>
							<IonButtons slot="start">
								<IonButton onClick={() => setSelected(null)}>
									<IonIcon
										icon={chevronBackOutline}
										slot="icon-only"
									/>
								</IonButton>
							</IonButtons>
							<IonTitle>Profile</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={handleDismiss}>
									<IonIcon
										icon={closeOutline}
										slot="icon-only"
									/>
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>

					<IonContent className="ion-padding" scrollY={false}>
						<div className="mx-auto flex h-full w-full max-w-md flex-col">
							<ProfileCard
								variant="elevated"
								identity={selected}
								className="shrink-0"
							/>
							<div className="mt-3 flex shrink-0 items-center justify-center gap-1">
								<span className="font-mono text-xs text-faint break-all text-center">
									{nip19.npubEncode(selected.pubkey)}
								</span>
								<CopyMorphButton
									value={nip19.npubEncode(selected.pubkey)}
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
									onClick={() => void handleUnlock(selected)}
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
											Switch to this profile
										</>
									)}
								</IonButton>
								<IonButton
									expand="block"
									size="large"
									fill="outline"
									color="danger"
									className="[--border-radius:12px]"
									disabled={busy !== null}
									onClick={() => void handleDelete(selected)}
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
							</div>
						</div>
					</IonContent>
				</>
			) : (
				<>
					<IonHeader className="ion-no-border">
						<IonToolbar>
							<IonTitle>Switch profile</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={handleDismiss}>
									<IonIcon
										icon={closeOutline}
										slot="icon-only"
									/>
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>

					<IonContent className="ion-padding">
						{others.length === 0 ? (
							<p className="mt-8 text-center text-sm leading-6 text-muted">
								No other profiles on this device yet.
							</p>
						) : (
							<>
								<p className="mb-4 text-center text-sm leading-6 text-muted">
									Choose another profile. If you cancel unlock,
									this session stays active.
								</p>
								<IonList
									lines="none"
									className="bg-transparent"
								>
									{others.map((identity) => (
										<InactiveProfileCard
											key={identity.pubkey}
											identity={identity}
											onClick={() =>
												setSelected(identity)
											}
											className="[--background:var(--app-surface-elevated)] bg-[var(--app-surface-elevated)] border-[var(--app-border)]"
										/>
									))}
								</IonList>
							</>
						)}
					</IonContent>

					<IonFooter className="ion-no-border">
						<IonToolbar>
							<div className="w-full px-4 pb-2">
								<IonButton
									expand="block"
									size="large"
									color="secondary"
									className="[--border-radius:12px]"
									onClick={() => {
										handleDismiss();
										router.push(
											"/profile/create",
											"forward",
											"push",
										);
									}}
								>
									Add New Profile
								</IonButton>
							</div>
						</IonToolbar>
					</IonFooter>
				</>
			)}
		</IonModal>
	);
}
