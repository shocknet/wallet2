import React, { useMemo, useState } from "react";
import {
	IonAvatar,
	IonButton,
	IonButtons,
	IonCol,
	IonContent,
	IonGrid,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonModal,
	IonPage,
	IonRow,
	IonSkeletonText,
	IonText,
	IonTitle,
	IonToolbar,

	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
	IonFooter
} from "@ionic/react";
import { chevronForward, closeOutline, keyOutline, peopleOutline, starOutline } from "ionicons/icons";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { identitiesRegistryActions, selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { selectIdentityDraft } from "@/State/scoped/backups/identity/slice";
import { useGetProfileQuery } from "@/State/api/api";
import { nip19 } from "nostr-tools";
import { selectSourceViews } from "@/State/scoped/backups/sources/selectors";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { RelayManager } from "@/Components/RelayManager";
import { IdentityType } from "@/State/identitiesRegistry/types";
import styles from "./styles/index.module.scss";
import { truncateTextMiddle } from "@/lib/format";
import HomeHeader from "@/Layout2/HomeHeader";
import { RouteComponentProps } from "react-router-dom";

const sameSet = (a: string[], b: string[]) => {
	if (a.length === 0 && b.length === 0) return true;
	const A = new Set(a);
	const B = new Set(b);
	if (A.size !== B.size) return false;
	for (const x of A) if (!B.has(x)) return false;
	return true;
};


const IdentityOverviewPage = (props: RouteComponentProps) => {
	const dispatch = useAppDispatch();

	const registry = useAppSelector(selectActiveIdentity)!;
	const idDoc = useAppSelector(selectIdentityDraft)!;
	const sourceViews = useAppSelector(selectSourceViews, (prev, next) => prev.length === next.length);


	const activeHex = registry.pubkey;


	const { data: profile, isLoading } = useGetProfileQuery({
		pubkey: activeHex!,
		relays: registry.type !== IdentityType.SANCTUM ? registry.relays : ["wss//:strfry.shock.network", "wss://relay.lightning.pub"]
	},
		{ skip: !activeHex }
	);

	const displayName = useMemo(
		() => profile?.display_name || profile?.name || "Anonymous",
		[profile]
	);
	const picture = profile?.picture || (activeHex ? `https://robohash.org/${activeHex}.png?bgset=bg1` : "");
	const nip05 = profile?.nip05;
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

	const updateRelays = () => {
		dispatch(identitiesRegistryActions.updateIdentityRelays({ pubkey: activeHex, relays: relays }))
	}


	const relaysDirty = useMemo(() => {
		if (registry.type === IdentityType.SANCTUM) return false;

		return !sameSet(registry.relays, relays)

	}, [registry, relays]);



	return (
		<IonPage className="ion-page-width">
			<HomeHeader {...props}>
			</HomeHeader>

			<IonContent className="ion-padding">
				<IonGrid>
					<IonRow className="ion-justify-content-center">
						<IonCol size="auto">
							<IonAvatar aria-hidden="true" style={{ width: 96, height: 96 }}>
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
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-center">
						<IonCol size="auto">
							<div style={{ marginTop: 4 }}>
								{isLoading ? (
									<IonSkeletonText animated style={{ width: 160, height: 18 }} />
								) : (
									<h2 className="text-weight-high text-lg">{displayName}</h2>
								)}
							</div>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-center">
						<IonCol size="auto">
							{nip05 && !isLoading && <IonText className="text-high" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nip05}</IonText>}

						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-center ion-align-items-center">
						<IonCol size="auto">


							<IonText className="text-medium text-weight-medium ion-text-justify code-string" >{truncateTextMiddle(npub, 14, 14)}</IonText>




						</IonCol>
						<IonCol size="auto">
							<CopyMorphButton value={npub} fill="clear" />
						</IonCol>
					</IonRow>
				</IonGrid>
				<div style={{ marginTop: "2rem" }}>
					<IdentityStatGrid
						sourcesCount={sourceViews.length}
						pubkeyHex={registry.pubkey}
						favoriteSourceId={idDoc.favorite_source_id.value}
						relaysCount={registry.type !== IdentityType.SANCTUM ? registry.relays.length : undefined}
						onClickRelays={() => setEditOpen(true)}
					/>
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
				<IonGrid style={{ paddingBottom: "0.9rem" }}>
					<IonRow className="ion-justify-content-center">
						<IonCol size="auto">
							<IonText className="text-medium text-weight-high">
								{getIdentityTypeText(registry.type)}
							</IonText>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-center ion-margin-top">
						<IonCol size="auto">
							<IonButton color="danger">
								<IonText className="text-high">
									Logout
								</IonText>
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>

			</IonFooter>
		</IonPage>
	);
}

export default IdentityOverviewPage;

type IdentityStatsProps = {
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
}


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
