import { useCallback, useEffect, useMemo, useState } from "react";
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonText,
	IonTitle,
	IonToolbar,
	useIonModal,
} from "@ionic/react";
import {
	chevronBackOutline,
	cloudOutline,
	extensionPuzzleOutline,
	keyOutline,
	saveOutline,
	swapHorizontalOutline,
} from "ionicons/icons";
import { nip19 } from "nostr-tools";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	identitiesRegistryActions,
	selectActiveIdentity,
	selectIdentityByPubkey,
} from "@/State/identitiesRegistry/slice";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { SwitchProfileSheet } from "@/Components/User/SwitchProfileSheet";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { RelayManager } from "@/Components/RelayManager";
import getIdentityNostrApi from "@/State/identitiesRegistry/helpers/identityNostrApi";
import {
	BackupKeysDialog,
	DownloadFileBackupDialog,
} from "@/Components/Modals/DialogeModals";
import type { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { downloadNsecBackup } from "@/lib/file-backup";
import { useToast } from "@/lib/contexts/useToast";
import { normalizeWsUrl } from "@/lib/url";
import { ProfileCard } from "@/Components/User/ProfileCard";

const sameSet = (a: string[], b: string[]) => {
	if (a.length === 0 && b.length === 0) return true;
	const A = new Set(a);
	const B = new Set(b);
	if (A.size !== B.size) return false;
	for (const x of A) if (!B.has(x)) return false;
	return true;
};

const IdentityOverviewPage = () => {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const runtime = useAppSelector(selectActiveIdentity);
	const registryIdentity = useAppSelector((state) =>
		runtime ? selectIdentityByPubkey(state, runtime.pubkey) : null,
	);

	const [switchOpen, setSwitchOpen] = useState(false);
	const [editingRelays, setEditingRelays] = useState(false);
	const [relays, setRelays] = useState<string[]>([]);

	useEffect(() => {
		if (!runtime) return;
		if (runtime.type === IdentityType.SANCTUM) {
			void getIdentityNostrApi(runtime)
				.then((api) => api.getRelays())
				.then((r) => {
					setRelays(Object.keys(r).map(normalizeWsUrl));
				})
				.catch(() => {
					/* sanctum relays are informational */
				});
			return;
		}
		setRelays(runtime.relays);
	}, [runtime]);

	const registryRelays = useMemo(() => {
		return registryIdentity && registryIdentity.type !== IdentityType.SANCTUM
			? registryIdentity.relays
			: [];
	}, [registryIdentity]);

	const relaysDirty = useMemo(() => {

		if (!runtime || runtime.type === IdentityType.SANCTUM) return false;
		return !sameSet(registryRelays, relays);
	}, [runtime, registryRelays, relays]);

	const npub = runtime ? nip19.npubEncode(runtime.pubkey) : "";

	const [presentKeysBackup, dismissKeysBackup] = useIonModal(
		<BackupKeysDialog
			dismiss={(data: undefined, role: "cancel" | "file" | "confirm") =>
				dismissKeysBackup(data, role)
			}
			privKey={
				runtime?.type === IdentityType.LOCAL_KEY
					? runtime.privateKey
					: ""
			}
		/>,
	);
	const [presentFileBackup, dismissFileBackup] = useIonModal(
		<DownloadFileBackupDialog
			dismiss={(
				data: { passphrase: string } | null,
				role: "cancel" | "confirm",
			) => dismissFileBackup(data, role)}
		/>,
	);

	const handleBackupFileDownload = useCallback(
		async (passphrase: string, privateKey: string) => {
			try {
				await downloadNsecBackup(privateKey, passphrase);
			} catch {
				showToast({
					color: "danger",
					message: "File backup download failed",
				});
			}
		},
		[showToast],
	);

	const handleBackup = useCallback(() => {
		if (runtime?.type !== IdentityType.LOCAL_KEY) return;

		presentKeysBackup({
			onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => {
				if (event.detail.role === "cancel") return;
				if (event.detail.role === "file") {
					presentFileBackup({
						onDidDismiss: (
							fileEvent: CustomEvent<OverlayEventDetail>,
						) => {
							if (fileEvent.detail.role !== "confirm") return;
							void handleBackupFileDownload(
								fileEvent.detail.data.passphrase,
								runtime.privateKey,
							);
						},
						cssClass: "dialog-modal wallet-modal",
					});
				}
			},
			cssClass: "dialog-modal wallet-modal",
		});
	}, [
		runtime,
		presentKeysBackup,
		presentFileBackup,
		handleBackupFileDownload,
	]);

	const saveRelays = () => {
		if (!runtime || runtime.type === IdentityType.SANCTUM) return;
		dispatch(
			identitiesRegistryActions.updateIdentityRelays({
				pubkey: runtime.pubkey,
				relays,
			}),
		);
		/* 		if (runtime.type !== IdentityType.SANCTUM) {
					dispatch(
						shellActions.activeIdentitySet({
							identity: { ...runtime, relays },
						}),
					);
				} */
		setEditingRelays(false);
		showToast({
			color: "success",
			message: "Relays updated",
		});
	};

	if (!runtime || !registryIdentity) {
		return (
			<IonPage className="ion-page-width">
				<IonContent className="ion-padding">
					<p className="text-muted text-center mt-12">
						No active profile.
					</p>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton
							icon={chevronBackOutline}
							defaultHref="/home"
						/>
					</IonButtons>
					<IonTitle>Active profile</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="mx-auto w-full max-w-md flex flex-col gap-8 pb-8">
					<section>
						<ProfileCard
							identity={registryIdentity}
							variant="elevated"
						/>
						<div className="mt-3 flex items-center justify-center gap-1">
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
					</section>

					<section className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
						<h2 className="text-base font-semibold tracking-tight text-primary mb-2">
							Security
						</h2>

						{runtime.type === IdentityType.LOCAL_KEY ? (
							<>
								<p className="text-sm leading-6 text-muted mb-4">
									Back up your secret key so you can recover
									this profile on another device.
								</p>
								<IonButton
									expand="block"
									color="secondary"
									className="[--border-radius:12px]"
									onClick={handleBackup}
								>
									<IonIcon slot="start" icon={keyOutline} />
									Backup secret key
								</IonButton>
							</>
						) : null}

						{runtime.type === IdentityType.SANCTUM ? (
							<div className="flex items-start gap-3">
								<div
									className="
										mt-0.5 flex size-9 shrink-0 items-center
										justify-center rounded-xl
										bg-[var(--app-surface-muted)]
										text-[var(--ion-color-primary)]
									"
								>
									<IonIcon icon={cloudOutline} />
								</div>
								<div>
									<p className="text-sm font-medium text-primary">
										Sanctum session
									</p>
									<p className="mt-1 text-sm leading-6 text-muted">
										{runtime.tokensData
											? "Signed in. If access expires, you will be asked to sign in again."
											: "Session needs refresh. You will be prompted to sign in again when required."}
										{runtime.reauthReason
											? ` (${runtime.reauthReason})`
											: ""}
									</p>
								</div>
							</div>
						) : null}

						{runtime.type === IdentityType.NIP07 ? (
							<div className="flex items-start gap-3">
								<div
									className="
										mt-0.5 flex size-9 shrink-0 items-center
										justify-center rounded-xl
										bg-[var(--app-surface-muted)]
										text-[var(--ion-color-primary)]
									"
								>
									<IonIcon icon={extensionPuzzleOutline} />
								</div>
								<div>
									<p className="text-sm font-medium text-primary">
										Browser extension
									</p>
									<p className="mt-1 text-sm leading-6 text-muted">
										Keys are managed by your Nostr
										extension. Export and backups happen
										there, not in this app.
									</p>
								</div>
							</div>
						) : null}
					</section>

					<section className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
						<div className="flex items-center justify-between gap-2 mb-2">
							<h2 className="text-base font-semibold tracking-tight text-primary">
								Backup / sync relays
							</h2>
							{runtime.type !== IdentityType.SANCTUM ? (
								<IonButton
									fill="clear"
									size="small"
									onClick={() =>
										setEditingRelays((v) => !v)
									}
								>
									{editingRelays ? "Done" : "Edit"}
								</IonButton>
							) : null}
						</div>

						{runtime.type === IdentityType.SANCTUM ? (
							<p className="text-sm leading-6 text-muted mb-3">
								Relays are managed by Sanctum.
							</p>
						) : null}

						{editingRelays &&
							runtime.type !== IdentityType.SANCTUM ? (
							<>
								<RelayManager
									relays={relays}
									setRelays={setRelays}
								/>
								<IonButton
									expand="block"
									className="mt-3 [--border-radius:12px]"
									disabled={!relaysDirty}
									onClick={saveRelays}
								>
									<IonIcon
										slot="start"
										icon={saveOutline}
									/>
									Save relays
								</IonButton>
							</>
						) : relays.length > 0 ? (
							<ul className="flex flex-col gap-2">
								{relays.map((relay) => (
									<li key={relay}>
										<IonText className="text-sm text-secondary break-all">
											{relay}
										</IonText>
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-muted">
								No relays configured.
							</p>
						)}
					</section>

					<section>
						<IonButton
							expand="block"
							fill="outline"
							color="medium"
							size="large"
							className="[--border-radius:12px]"
							onClick={() => setSwitchOpen(true)}
						>
							<IonIcon
								slot="start"
								icon={swapHorizontalOutline}
							/>
							Use another profile
						</IonButton>
					</section>
				</div>
			</IonContent>

			<SwitchProfileSheet
				isOpen={switchOpen}
				onDidDismiss={() => setSwitchOpen(false)}
			/>
		</IonPage>
	);
};

export default IdentityOverviewPage;
