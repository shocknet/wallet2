// IdentityOverviewPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	IonAvatar, IonBadge, IonButton, IonButtons, IonCol, IonContent, IonGrid,
	IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonModal,
	IonNote, IonPage, IonRow, IonSkeletonText, IonText, IonTitle, IonToolbar,
	IonInput, useIonRouter,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent
} from "@ionic/react";
import { checkmarkCircle, chevronForward, cloudUploadOutline, copyOutline, createOutline, globeOutline, keyOutline, linkOutline, peopleOutline, starOutline } from "ionicons/icons";
import { useHistory, useLocation } from "react-router";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentity, selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
import { identityActions, selectIdentityDraft, selectIsIdentityDirty } from "@/State/scoped/backups/identity/slice";
import CardishList from "@/Components/CardishList";
import BackToolbar from "@/Layout2/BackToolbar";
import { useGetProfileQuery } from "@/State/api/api";
import { nip19 } from "nostr-tools";
import { Browser } from "@capacitor/browser";
import { selectSourceViews, SourceView } from "@/State/scoped/backups/sources/selectors";
import SourceCard from "@/Components/SourceCard";
import { EditSourceModal } from "@/Components/Modals/Sources/EditSourceModal";
import AddSourceNavModal from "@/Components/Modals/Sources/AddSourceModal";
import CopyMorphButton from "@/Components/CopyMorphButton";


// tiny in-file helpers to avoid extra CSS
const Row = ({ left, right, skeletonWidth }: { left: React.ReactNode; right?: React.ReactNode; skeletonWidth?: number }) => (
	<IonItem lines="full">
		<div style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: 12 }}>
			<IonText className="text-medium text-weight-high">{left}</IonText>
			{right ?? (skeletonWidth ? <IonSkeletonText animated style={{ width: skeletonWidth, height: 14 }} /> : <IonText>—</IonText>)}
		</div>
	</IonItem>
);

const IdentityOverviewPage: React.FC = () => {
	const router = useIonRouter();
	const dispatch = useAppDispatch();
	const history = useHistory();
	const location = useLocation<{ from?: "created" } | undefined>();
	const sources = useAppSelector(selectSourceViews);

	// protected route: these exist
	const registry = useAppSelector(selectActiveIdentity)!;
	const idDoc = useAppSelector(selectIdentityDraft)!;
	const isDirty = useAppSelector(selectIsIdentityDirty);

	// reflect external changes
	const [label, setLabel] = useState(idDoc.label.value ?? "");
	const [bridgeUrl, setBridgeUrl] = useState(idDoc.bridge_url.value ?? "");
	useEffect(() => setLabel(idDoc.label.value ?? ""), [idDoc.label.value]);
	useEffect(() => setBridgeUrl(idDoc.bridge_url.value ?? ""), [idDoc.bridge_url.value]);

	// nostr kind:0 (read-only)
	const activeHex = useAppSelector(selectActiveIdentityId);
	const { data: profile, isLoading } = useGetProfileQuery(activeHex!, { skip: !activeHex });

	const displayName = useMemo(
		() => profile?.display_name || profile?.name || idDoc.label.value || "Anonymous",
		[profile?.display_name, profile?.name, idDoc.label.value]
	);
	const picture = profile?.picture || (activeHex ? `https://robohash.org/${activeHex}.png?bgset=bg1` : "");
	const nip05 = profile?.nip05;
	const npub = useMemo(() => (activeHex ? nip19.npubEncode(activeHex) : ""), [activeHex]);
	const openFullProfile = async () => {
		if (!npub) return;
		const nostrUri = `nostr:${npub}`;                 // NIP-21 deep link
		const webUrl = `https://iris.to/${npub}`;       // friendly web fallback

		// Try deep link first; if it fails, fall back to web
		try {
			await Browser.open({ url: nostrUri });
		} catch {
			await Browser.open({ url: webUrl });
		}
	};

	const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => { });


	// “Continue” CTA after creation
	const cameFromCreate = location.state?.from === "created";
	const onContinue = () => {
		history.replace({ pathname: "/identity/overview", state: undefined });
		history.push("/home");
	};

	// edit modal for local doc
	const [editOpen, setEditOpen] = useState(false);
	const onSaveLocal = () => {
		if (label !== idDoc.label.value) {
			dispatch(identityActions.updateIdentityLabel({ label, by: "device" }));
		}
		const nextBridge = bridgeUrl.trim() || null;
		if (nextBridge !== (idDoc.bridge_url.value ?? null)) {
			dispatch(identityActions.setBridgeUrl({ url: nextBridge, by: "device" }));
		}
		setEditOpen(false);
	};

	const [selectedSource, setSelectedSource] = useState<SourceView | null>(null);
	const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);

	const onAddClose = useCallback(() => {
		setIsAddSourceOpen(false)
	}, []);


	const img = profile?.picture;

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<BackToolbar title="" />
				{/* <IonToolbar>
					<IonTitle className="android-centered-title">User Profile</IonTitle>
					<IonButtons slot="end">
						<IonBadge color={isDirty ? "warning" : "success"} style={{ marginLeft: 8 }}>
							<IonIcon icon={isDirty ? cloudUploadOutline : checkmarkCircle} className="ion-margin-end" />
							{isDirty ? "pending publish…" : "synced"}
						</IonBadge>
					</IonButtons>
				</IonToolbar> */}
				<IonToolbar className="big-toolbar">
					<IonTitle className="android-centered-title">User Profile</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<IonGrid className="ion-padding">
					<IonRow>
						<IonCol size="auto">
							<div style={{ width: 96 }}>
								{isLoading ? (
									<IonSkeletonText animated style={{ width: 96, height: 96, borderRadius: "50%" }} />
								) : (
									<img
										src={img || `https://robohash.org/${activeHex}.png?bgset=bg1`}
										alt={displayName}
										style={{ width: "96px", height: "96px", display: "block", objectFit: "cover", borderRadius: "50%" }}
										referrerPolicy="no-referrer"
										onError={(e) => {
											const el = e.currentTarget as HTMLImageElement;
											if (!el.dataset.fallback) {
												el.dataset.fallback = "1";
												el.src = `https://robohash.org/${activeHex}.png?bgset=bg1`;
											}
										}}
									/>
								)}

							</div>
						</IonCol>
						<IonCol>
							{isLoading ? (
								<IonSkeletonText animated style={{ width: 160, height: 18 }} />
							) : (
								<h2 className="text-weight-high text-lg">{displayName}</h2>
							)}
						</IonCol>

					</IonRow>
				</IonGrid>
				{/* Profile Hero (Nostr kind:0, read-only if present) */}
				{/* 				{(isLoading || profile) && (
					<div className="profile-hero" style={{ display: "grid", justifyItems: "center", gap: 6, margin: "8px 0 16px", textAlign: "center" }}>
						<IonAvatar className="hero-avatar" aria-hidden="true" style={{ width: 96, height: 96 }}>
							{isLoading ? (
								<IonSkeletonText animated style={{ width: 96, height: 96, borderRadius: "50%" }} />
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
									style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "50%" }}
								/>
							)}
						</IonAvatar>

						<div className="hero-name" style={{ marginTop: 4 }}>
							{isLoading ? (
								<IonSkeletonText animated style={{ width: 160, height: 18 }} />
							) : (
								<h2 className="text-weight-high text-lg">{displayName}</h2>
							)}
						</div>

						<div className="hero-lines" style={{ display: "grid", gap: 2, maxWidth: "100%" }}>
							{nip05 && !isLoading && <IonText className="text-medium" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nip05}</IonText>}
							{!!npub && (
								<div className="hero-row" style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
									<IonText className="text-medium" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{npub}</IonText>
									<IonButton size="small" fill="clear" onClick={() => copy(npub)} aria-label="Copy npub">
										<IonIcon icon={copyOutline} />
									</IonButton>
								</div>
							)}
						</div>

						<div className="hero-actions" style={{ display: "flex", gap: 8, marginTop: 8 }}>
							<IonButton size="small" color="primary" onClick={() => setEditOpen(true)}>
								<IonIcon icon={createOutline} className="ion-margin-end" />
								Edit Local Info
							</IonButton>

							{!!npub && (
								<IonButton size="small" color="tertiary" onClick={openFullProfile}>
									View Full Profile
								</IonButton>
							)}
						</div>
					</div>
				)} */}
				<div style={{ marginTop: "2rem" }}>

					<IdentityStatGrid

						sourcesCount={3}
						bridgeUrl={idDoc.bridge_url.value}
						pubkeyHex={registry.pubkey}
						favoriteSourceId={idDoc.favorite_source_id.value}
					/>
				</div>
				<IonList>
					{
						sources.map(s => <SourceCard key={s.sourceId} source={s} onClick={() => setSelectedSource(s)} />)
					}
				</IonList>

				<EditSourceModal
					source={selectedSource}
					onClose={() => setSelectedSource(null)}
					onDelete={() => console.log("delete here")}
					onSave={() => console.log("onSave")}
					open={!!selectedSource}
				/>
				<IonButton onClick={() => setIsAddSourceOpen(true)}>add</IonButton>

				<AddSourceNavModal open={isAddSourceOpen} onClose={onAddClose} />







				{/* Edit modal (local doc only) */}
				<IonModal isOpen={editOpen} onDidDismiss={() => setEditOpen(false)}>
					<IonHeader>
						<IonToolbar>
							<IonTitle>Edit Local Info</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={() => setEditOpen(false)}>Close</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">
						<IonList lines="full">
							<IonListHeader><IonLabel><strong>Local fields</strong></IonLabel></IonListHeader>
							<IonItem>
								<IonLabel position="stacked">Label</IonLabel>
								<IonInput value={label} onIonChange={(e) => setLabel(e.detail.value ?? "")} />
							</IonItem>
							<IonItem>
								<IonLabel position="stacked">Bridge URL</IonLabel>
								<IonInput inputmode="url" value={bridgeUrl} onIonChange={(e) => setBridgeUrl(e.detail.value ?? "")} />
							</IonItem>
							<IonItem lines="none" className="ion-margin-top">
								<IonButton expand="block" onClick={onSaveLocal}>Save</IonButton>
							</IonItem>
						</IonList>
					</IonContent>
				</IonModal>

			</IonContent>
		</IonPage>
	);
};

export default IdentityOverviewPage;

type IdentityStatsProps = {
	sourcesCount: number;
	bridgeUrl?: string | null;
	pubkeyHex: string;
	favoriteSourceId?: string | null;
};

const tileStyle: React.CSSProperties = { height: "100%", borderRadius: 12 };


export function IdentityStatGrid({
	sourcesCount,
	bridgeUrl,
	pubkeyHex,
	favoriteSourceId,
}: IdentityStatsProps) {
	const openUrl = async (u?: string | null) => {
		if (!u) return;
		const url = u.startsWith("http") ? u : `https://${u}`;
		try { await Browser.open({ url }); } catch { }
	};
	const copy = (t: string) => navigator.clipboard?.writeText(t).catch(() => { });

	const trunc = (t: string, n = 26) => (t.length > n ? t.slice(0, n - 3) + "…" : t);

	return (
		<IonGrid className="ion-no-padding" style={{ marginTop: 12 }}>
			<IonRow style={{ gap: 12 }}>
				{/* Sources */}
				<IonCol size="auto">
					<IonCard button routerLink="" color="secondary" style={tileStyle} className="wallet-box-shadow">
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

				{/* Bridge URL (optional) */}
				{bridgeUrl && (
					<IonCol  >
						<IonCard color="secondary" style={tileStyle} className="wallet-box-shadow secondary">
							<IonCardHeader>
								<IonCardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<IonIcon icon={globeOutline} />
									Bridge URL
								</IonCardTitle>
							</IonCardHeader>
							<IonCardContent style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
								<IonText className="truncate" style={{ maxWidth: "70%" }}>{trunc(bridgeUrl)}</IonText>
								<div style={{ display: "flex", gap: 4 }}>
									<IonButton size="small" fill="clear" onClick={() => openUrl(bridgeUrl)}>
										<IonIcon icon={linkOutline} />
									</IonButton>
									<IonButton size="small" fill="clear" onClick={() => copy(bridgeUrl)}>
										<IonIcon icon={copyOutline} />
									</IonButton>
								</div>
							</IonCardContent>
						</IonCard>
					</IonCol>
				)}

				{/* Pubkey */}
				<IonCol  >
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

				{/* Favorite source (optional) */}
				{favoriteSourceId && (
					<IonCol size="12" sizeMd="6" sizeLg="3" >
						<IonCard color="secondary" style={tileStyle} className="wallet-box-shadow secondary">
							<IonCardHeader>
								<IonCardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<IonIcon icon={starOutline} />
									Favorite
								</IonCardTitle>
							</IonCardHeader>
							<IonCardContent style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
								<IonText className="truncate" style={{ maxWidth: "75%" }}>{trunc(favoriteSourceId)}</IonText>
								<IonButton size="small" fill="clear" onClick={() => copy(String(favoriteSourceId))}>
									<IonIcon icon={copyOutline} />
								</IonButton>
							</IonCardContent>
						</IonCard>
					</IonCol>
				)}
			</IonRow>
		</IonGrid>
	);
}
