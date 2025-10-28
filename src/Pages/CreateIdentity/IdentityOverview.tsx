import { useCallback, useMemo, useState } from "react";
import {
	IonAvatar,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonModal,
	IonPage,
	IonSkeletonText,
	IonText,
	IonTitle,
	IonToolbar,
	IonFooter,
	useIonViewDidEnter,
	useIonModal,
} from "@ionic/react";
import { closeOutline, key, pencil } from "ionicons/icons";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { identitiesRegistryActions, selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { useGetProfileQuery } from "@/State/api/api";
import { nip19, utils } from "nostr-tools";
import { selectNprofileViews } from "@/State/scoped/backups/sources/selectors";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { RelayManager } from "@/Components/RelayManager";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { truncateTextMiddle } from "@/lib/format";
import HomeHeader from "@/Layout2/HomeHeader";
import getIdentityNostrApi from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { BackupKeysDialog, DownloadFileBackupDialog } from "@/Components/Modals/DialogeModals";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { downloadNsecBackup } from "@/lib/file-backup";
import { useToast } from "@/lib/contexts/useToast";

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

	const registry = useAppSelector(selectActiveIdentity)!;
	const activeHex = registry.pubkey;

	const nprofileSources = useAppSelector(selectNprofileViews);
	const adminSource = nprofileSources.find(s => s.adminToken);


	const { data: profile, isLoading } = useGetProfileQuery({
		pubkey: activeHex!,
		relays: registry.type !== IdentityType.SANCTUM ? registry.relays : ["wss://strfry.shock.network", "wss://relay.lightning.pub"]
	},
		{ skip: !activeHex }
	);

	const displayName = useMemo(
		() => profile?.display_name || profile?.name || "Anonymous",
		[profile]
	);
	const picture = profile?.picture || (activeHex ? `https://robohash.org/${activeHex}.png?bgset=bg1` : "");
	const npub = nip19.npubEncode(activeHex);

	const _openFullProfile = async () => {
		/* TODO: link to bxrd */
	};


	// edit modal for local doc
	const [editOpen, setEditOpen] = useState(false);

	const [isEditingRelays, setIsEditingRelays] = useState(false);



	const [relays, setRelays] = useState(
		registry.type !== IdentityType.SANCTUM
			? registry.relays
			: []

	);

	const [presentKeysBackup, dismissKeysBackup] = useIonModal(
		<BackupKeysDialog dismiss={(data: undefined, role: "cancel" | "file" | "confirm") => dismissKeysBackup(data, role)} privKey={registry.type === IdentityType.LOCAL_KEY ? registry.privkey : ""} />
	);
	const [presentFileBackup, dismissFileBackup] = useIonModal(
		<DownloadFileBackupDialog
			dismiss={(data: { passphrase: string } | null, role: "cancel" | "confirm") => dismissFileBackup(data, role)}
		/>
	);

	const handleBackupFileDownload = useCallback(async (passphrase: string, privateKey: string) => {
		try {
			await downloadNsecBackup(privateKey, passphrase);
		} catch {
			showToast({
				color: "danger",
				message: "File backup download failed"
			});
			return;
		}

	}, [showToast]);

	const handleBackup = useCallback(async () => {

		presentKeysBackup({
			onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => {
				if (event.detail.role === "cancel") return;
				if (event.detail.role === "file") {
					presentFileBackup({
						onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => {
							if (event.detail.role === "cancel") return;
							if (event.detail.role === "confirm") {
								handleBackupFileDownload(event.detail.data.passphrase, registry.pubkey);

							}
						},
						cssClass: "dialog-modal wallet-modal"
					})
					return;
				}



			},
			cssClass: "dialog-modal wallet-modal"
		});
	}, [handleBackupFileDownload, presentFileBackup, registry.pubkey, presentKeysBackup])

	useIonViewDidEnter(() => {
		if (registry.type === IdentityType.SANCTUM) {
			getIdentityNostrApi(registry)
				.then((api) => {
					api.getRelays()
						.then((r) => {
							const sanctumRelays = Object.keys(r);
							setRelays(sanctumRelays.map(utils.normalizeURL))
						})
						.catch(() => console.error("Error getting sanctum relays"))
				})
				.catch(() => console.error("Error getting sanctum api"))
		}
	})
	const updateRelays = () => {
		dispatch(identitiesRegistryActions.updateIdentityRelays({ pubkey: activeHex, relays: relays }))
	}


	const relaysDirty = useMemo(() => {
		if (registry.type === IdentityType.SANCTUM) return false;

		return !sameSet(registry.relays, relays)

	}, [registry, relays]);



	return (
		<IonPage className="ion-page-width">
			<HomeHeader>
				<IonToolbar>
					<IonTitle className="android-centered-title">
						Profile
					</IonTitle>
				</IonToolbar>
			</HomeHeader>

			<IonContent className="ion-padding">
				<div className="page-outer">
					<div className="page-body">

						<section className="hero-block flex-row gap-4">
							<div className="flex items-center flex-grow  justify-center max-w-[80px] lg:max-w-[100px]">
								<IonAvatar aria-hidden="true" style={{ width: "100%", height: "100%" }}>
									{isLoading ? (
										<IonSkeletonText
											animated
											className="w-full aspect-square"
										/>
									) : (
										<img
											src={picture}
											alt=""
											referrerPolicy="no-referrer"
											onError={(e) => {
												const el = e.currentTarget as HTMLImageElement;
												if (!/robohash/.test(el.src) && activeHex) {
													el.src = `https://robohash.org/${activeHex}.png?bgset=bg1`;
												}
											}}
										/>
									)}
								</IonAvatar>
							</div>

							<div className="flex flex-col items-start">
								<div className="text-high text-left font-semibold text-xl">
									{displayName}
								</div>

								<div className="flex flex-row flex-wrap items-center justify-center gap-2 mt-1">
									<IonText className="text-medium ion-text-wrap text-weight-medium ion-text-justify code-string">
										{truncateTextMiddle(npub, 6, 6)}
									</IonText>
									<CopyMorphButton shape="round" size="small" value={npub} fill="clear" />
								</div>
							</div>


						</section>


						<section className="main-block flex justify-center items-center mt-2">
							<dl className="w-full max-w-[400px] grid grid-cols-1 gap-y-6 sm:grid-cols-[auto,1fr] sm:gap-x-2">
								{/* RELAYS */}
								{relays.length !== 0 && (
									<>
										<dt className="text-high text-lg text-center sm:text-left sm:pr-2">
											Backup/Sync Relays:
										</dt>

										<dd className="text-md pt-1 text-low  leading-snug break-all text-center sm:text-left">
											{relays.map(r => (
												<div key={r}>{r}</div>
											))}
										</dd>
									</>
								)}

								{/* ADMIN */}
								{adminSource && (
									<>
										<dt className="text-high text-lg text-center sm:text-left  sm:pr-2">
											Administrator of:
										</dt>

										<dd className="text-low pt-1  leading-snug break-all text-center sm:text-left">
											{truncateTextMiddle(
												nip19.nprofileEncode({
													pubkey: adminSource.lpk,
													relays: adminSource.relays,
												})
											)}
										</dd>
									</>
								)}
							</dl>
						</section>
						{
							registry.type !== IdentityType.SANCTUM
							&&
							<section className="main-block flex justify-center mt-20">
								<IonButton color="light" onClick={() => setEditOpen(true)}>
									<IonIcon slot="start" icon={pencil} />
									Edit Identity
								</IonButton>
							</section>
						}
						{
							registry.type === IdentityType.LOCAL_KEY
							&&
							<section className="main-block flex justify-center mt-20">
								<IonButton color="light" onClick={handleBackup}>
									<IonIcon slot="start" icon={key} />
									Backup secret key
								</IonButton>
							</section>
						}

					</div>
				</div>






				<IonModal className="wallet-modal" isOpen={editOpen} onDidDismiss={() => setEditOpen(false)}>
					<IonHeader>
						<IonToolbar>

							<IonTitle>
								<span className="text-medium">

									Edit Identity
								</span>
							</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={() => setEditOpen(false)}><IonIcon icon={closeOutline} /></IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">

						{
							registry.type !== IdentityType.SANCTUM
							&&
							<IonList

								lines="none"
								style={{ borderRadius: "12px", marginTop: "0.5rem" }}

							>

								<IonListHeader className="text-medium" style={{ fontWeight: "600", fontSize: "1rem" }} lines="full">
									<IonLabel >Relays</IonLabel>
									{
										isEditingRelays
											?
											<IonButton style={{ marginRight: "0.5rem" }} onClick={() => setIsEditingRelays(false)}>
												<IonIcon icon={closeOutline} slot="icon-only" />
											</IonButton>
											:
											<IonButton style={{ marginRight: "0.5rem" }} onClick={() => setIsEditingRelays(true)}>
												Edit
											</IonButton>
									}
								</IonListHeader>
								{
									isEditingRelays
										? (
											<>
												<RelayManager relays={relays} setRelays={setRelays} />
											</>
										)
										: relays.map(r => (
											<IonItem key={r}>
												<IonText className="text-medium text-weight-medium" style={{ textDecoration: "underline" }}>
													{r}
												</IonText>
											</IonItem>
										))
								}
							</IonList>
						}

					</IonContent>
					<IonFooter className="ion-no-border">
						<IonToolbar color="secondary">
							<IonButtons slot="end">

								<IonButton color="primary" disabled={!relaysDirty} onClick={updateRelays}>
									Save Changes
								</IonButton>

							</IonButtons>

						</IonToolbar>
					</IonFooter>
				</IonModal>

			</IonContent>
			<IonFooter className="ion-no-border">
				<div className="flex justify-center pb-3">
					<div className="text-medium font-semibold text-lg">
						{getIdentityTypeText(registry.type)}
					</div>
				</div>


			</IonFooter>
		</IonPage>
	);
}

export default IdentityOverviewPage;

/* type IdentityStatsProps = {
	sourcesCount: number;
	bridgeUrl?: string | null;
	pubkeyHex: string;
	favoriteSourceId?: string | null;
	relaysCount?: number;
	onClickRelays: () => void;
};

const tileStyle: React.CSSProperties = { height: "100%", borderRadius: 12 };


export function IdentityStatGrid({
	sourcesCount,
	pubkeyHex,
	favoriteSourceId,
	relaysCount,
	onClickRelays
}: IdentityStatsProps) {



	const trunc = (t: string, n = 26) => (t.length > n ? t.slice(0, n - 3) + "…" : t);

	return (
		<IonGrid className="ion-no-padding" style={{ marginTop: 12 }}>
			<IonRow className="ion-text-wrap ion-justify-content-center" style={{ gap: "0.6rem" }}>

				<IonCol size="auto" className={styles["stats-grid-card"]}>
					<IonCard button routerLink="/sources" color="secondary" style={tileStyle} className="wallet-box-shadow">
						<IonCardHeader>
							<IonCardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<IonIcon icon={peopleOutline} />
								Sources
								<IonIcon icon={chevronForward} />
							</IonCardTitle>
						</IonCardHeader>
						<IonCardContent>
							<div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "center" }}>

								<IonText className="text-weight-high text-lg">{sourcesCount}</IonText>
								<IonText className="text-medium text-low">configured</IonText>
							</div>
						</IonCardContent>
					</IonCard>
				</IonCol>

				<IonCol size="auto" className={styles["stats-grid-card"]}>
					<IonCard color="secondary" style={tileStyle} className="wallet-box-shadow secondary">
						<IonCardHeader>
							<IonCardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<IonIcon icon={keyOutline} />
								Pubkey
							</IonCardTitle>
						</IonCardHeader>
						<IonCardContent style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
							<IonText className="truncate code-string" style={{ maxWidth: "70%" }}>
								{trunc(pubkeyHex, 34)}
							</IonText>
							<CopyMorphButton fill="clear" size="small" value={pubkeyHex} />

						</IonCardContent>
					</IonCard>
				</IonCol>
				{favoriteSourceId && (
					<IonCol size="auto" className={styles["stats-grid-card"]}>
						<IonCard color="secondary" style={tileStyle} className="wallet-box-shadow secondary">
							<IonCardHeader>
								<IonCardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<IonIcon icon={starOutline} />
									Favorite
								</IonCardTitle>
							</IonCardHeader>
							<IonCardContent style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
								<IonText className="truncate code-string" style={{ maxWidth: "70%" }}>
									{trunc(favoriteSourceId, 34)}
								</IonText>
								<CopyMorphButton fill="clear" size="small" value={pubkeyHex} />
							</IonCardContent>
						</IonCard>
					</IonCol>
				)}
				{relaysCount !== undefined && (
					<IonCol size="auto" className={styles["stats-grid-card"]}>
						<IonCard button onClick={onClickRelays} color="secondary" style={tileStyle} className="wallet-box-shadow">
							<IonCardHeader>
								<IonCardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<IonIcon icon={peopleOutline} />
									Relays
									<IonIcon icon={chevronForward} />
								</IonCardTitle>
							</IonCardHeader>
							<IonCardContent>
								<div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "center" }}>

									<IonText className="text-weight-high text-lg">{relaysCount}</IonText>
									<IonText className="text-medium text-low">configured</IonText>
								</div>
							</IonCardContent>
						</IonCard>
					</IonCol>
				)}


			</IonRow>
		</IonGrid>
	);
} */


const getIdentityTypeText = (type: IdentityType) => {
	switch (type) {
		case IdentityType.LOCAL_KEY:
			return "Local key"
		case IdentityType.NIP07:
			return "Nip07/browser extension"
		default:
			return "Email"
	}
}
