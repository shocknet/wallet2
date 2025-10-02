import React, { useRef, useMemo } from "react";
import {
	IonAvatar, IonBadge, IonButton, IonButtons, IonContent, IonHeader,
	IonIcon, IonItem, IonLabel, IonList, IonModal, IonSkeletonText, IonText, IonTitle, IonToolbar,
	useIonRouter
} from "@ionic/react";
import {
	personOutline, closeOutline, checkmarkCircle, personCircleOutline, addOutline,
	trashOutline
} from "ionicons/icons";
import { nip19 } from "nostr-tools";

import { useAppSelector, useAppDispatch } from "@/State/store/hooks";
import { identitiesSelectors, selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
import { switchIdentity } from "@/State/identitiesRegistry/thunks";
import { useGetProfileQuery } from "@/State/api/api";

const robo = (hex?: string) => hex ? `https://robohash.org/${hex}.png?bgset=bg1` : "";

const truncate = (s: string, n = 24) => (s && s.length > n ? s.slice(0, n - 3) + "…" : s);

const Switcher: React.FC = () => {
	const modal = useRef<HTMLIonModalElement>(null);
	const dispatch = useAppDispatch();
	const router = useIonRouter();

	const all = useAppSelector(identitiesSelectors.selectAll);
	const activeHex = useAppSelector(selectActiveIdentityId);

	const onSwitch = async (pubkeyHex: string) => {
		await dispatch(switchIdentity(pubkeyHex, true));
		modal.current?.dismiss();
	};

	const openProfile = () => {
		modal.current?.dismiss();
		router.push("/identity/overview", "forward", "push");
	};

	const openIdentities = () => {
		modal.current?.dismiss();
		router.push("/identities", "forward", "push");
	};

	return (
		<>
			<IonButton id="open-switcher-modal" shape="round" fill="clear" aria-label="Open identity switcher">
				<IonIcon color="light" icon={personOutline} />
			</IonButton>

			<IonModal
				className="wallet-modal"
				ref={modal}
				trigger="open-switcher-modal"
				initialBreakpoint={0.75}
				breakpoints={[0, 0.5, 0.75, 1]}
				handleBehavior="cycle"
				expandToScroll={false}
			>
				<IonHeader>
					<IonToolbar color="secondary">
						<IonTitle>Switch Identity</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={openProfile}>
								<IonIcon icon={personCircleOutline} className="ion-margin-end" />
								Profile
							</IonButton>
							<IonButton onClick={() => modal.current?.dismiss()}>
								<IonIcon icon={closeOutline} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>

				<IonContent className="ion-padding">
					<IonList lines="full" className="round secondary">
						{all.map((id) => (
							<IdentityRow
								key={id.pubkey}
								pubkeyHex={id.pubkey}
								fallbackLabel={id.label}
								activeHex={activeHex}
								onPick={onSwitch}
							/>
						))}

						<div style={{ height: 8 }} />
						<IonItem button detail onClick={openIdentities}>
							<IonIcon slot="start" icon={addOutline} />
							<IonLabel>
								<h2 className="text-high" style={{ margin: 0 }}>Add an identity</h2>

							</IonLabel>
						</IonItem>
					</IonList>
				</IonContent>
			</IonModal>
		</>
	);
};

export default Switcher;





export const IdentityRow: React.FC<{
	pubkeyHex: string;
	fallbackLabel?: string | null;
	activeHex?: string | null;
	onPick: (pubkeyHex: string) => void;
}> = ({ pubkeyHex, fallbackLabel, activeHex, onPick }) => {
	const { data: profile, isLoading } = useGetProfileQuery(pubkeyHex, { skip: !pubkeyHex });
	const isActive = activeHex === pubkeyHex;

	const displayName = useMemo(
		() => profile?.display_name || profile?.name || fallbackLabel || "Anonymous",
		[profile?.display_name, profile?.name, fallbackLabel]
	);
	const picture = profile?.picture || robo(pubkeyHex);
	const nip05 = profile?.nip05 || "";
	const npub = useMemo(() => (pubkeyHex ? nip19.npubEncode(pubkeyHex) : ""), [pubkeyHex]);

	return (
		<IonItem
			button
			detail={!isActive}
			onClick={() => !isActive && onPick(pubkeyHex)}
			style={{
				borderRadius: 12,
				marginBottom: 6,
			}}
		>
			<IonAvatar slot="start" aria-hidden="true" style={{ width: 40, height: 40 }}>
				{isLoading ? (
					<IonSkeletonText animated style={{ width: 40, height: 40, borderRadius: "50%" }} />
				) : (
					<img
						src={picture}
						alt=""
						referrerPolicy="no-referrer"
						onError={(e) => {
							const el = e.currentTarget as HTMLImageElement;
							if (!/robohash/.test(el.src)) el.src = robo(pubkeyHex);
						}}
					/>
				)}
			</IonAvatar>

			<IonLabel>

				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					{isLoading ? (
						<IonSkeletonText animated style={{ width: 140, height: 16, borderRadius: 6 }} />
					) : (
						<h2 className="text-high" style={{ margin: 0 }}>
							{displayName}
						</h2>
					)}
					{isActive && !isLoading && (
						<IonBadge color="primary" style={{ textTransform: "none" }}>
							<IonIcon icon={checkmarkCircle} className="ion-margin-end" />
							Active
						</IonBadge>
					)}
				</div>


				<div style={{ marginTop: 4 }}>
					{isLoading ? (
						<IonSkeletonText animated style={{ width: 200, height: 12, borderRadius: 6 }} />
					) : (
						<IonText className="text-low" style={{ margin: 0 }}>
							{nip05 ? nip05 : truncate(npub, 32)}
						</IonText>
					)}
				</div>
			</IonLabel>
			<IonButton slot="end">
				<IonIcon icon={trashOutline} slot="icon-only" />
			</IonButton>
		</IonItem>
	);
};
