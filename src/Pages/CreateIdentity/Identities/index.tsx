import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonIcon,
	IonContent,
	IonList,
	IonItem,
	IonLabel,
	IonAvatar,
	useIonRouter,
	useIonLoading,
	IonSkeletonText,
	IonText,
	IonBadge
} from "@ionic/react";
import { chevronBackOutline, addOutline, checkmarkCircle, trashOutline } from "ionicons/icons";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";

import { identitiesSelectors, selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
import { switchIdentity } from "@/State/identitiesRegistry/thunks";
import { useToast } from "@/lib/contexts/useToast";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import { truncateTextMiddle } from "@/lib/format";
import { nip19 } from "nostr-tools";
import { useGetProfileQuery } from "@/State/api/api";

export default function IdentitiesPage() {
	const router = useIonRouter();
	const [present, dismiss] = useIonLoading();
	const all = useAppSelector(identitiesSelectors.selectAll);
	const activeHex = useAppSelector(selectActiveIdentityId);
	const dispatch = useAppDispatch();
	const { showToast } = useToast();




	const onSwitch = async (pubkey: string) => {
		if (activeHex === pubkey) {
			console.log("here")
			return router.push("/identity/overview", "forward", "push")

		}
		await present({
			message: "Switching identity..."
		})
		try {
			await dispatch(switchIdentity(pubkey));
			await dismiss();
			router.push("/sources", "forward", "push");
		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.message || "An error occured when switching to identity"
			})
			await dismiss();
		}
	};


	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton routerLink="/home" routerDirection="back">
							<IonIcon icon={chevronBackOutline} />
						</IonButton>
					</IonButtons>
					<IonTitle>Identities</IonTitle>
					<IonButtons slot="end">
						<IonButton routerLink="/identity/create">
							<IonIcon icon={addOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<IonList lines="full">
					{all.map((id) => (
						<IdentityRow
							key={id.pubkey}
							identity={id}
							activeHex={activeHex}
							onPick={onSwitch}
						/>
					))}
				</IonList>
			</IonContent>
		</IonPage>
	);
}


const IdentityRow
	= (
		{ identity, activeHex, onPick }: {
			identity: Identity;
			activeHex?: string | null;
			onPick: (pubkeyHex: string) => void;
		}
	) => {
		const pubkeyHex = identity.pubkey;
		const { data: profile, isLoading } = useGetProfileQuery({
			pubkey: activeHex!,
			relays: identity.type !== IdentityType.SANCTUM ? identity.relays : ["wss://strfry.shock.network", "wss://relay.lightning.pub"]
		},
			{ skip: !activeHex }
		);
		const isActive = activeHex === pubkeyHex;

		const displayName = profile?.display_name || profile?.name || "Anonymous"
		const picture = profile?.picture || robo(pubkeyHex);
		const npub = nip19.npubEncode(pubkeyHex);

		return (
			<IonItem
				button
				detail={false}
				onClick={() => onPick(pubkeyHex)}
				style={{
					borderRadius: 12,
					marginBottom: 6,
				}}
			>
				<IonAvatar slot="start">
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
					<IonText className="text-high text-md">
						{displayName}
					</IonText>

					<IonText className="ion-margin-top text-medium code-string" style={{ display: "block" }}>
						{truncateTextMiddle(npub)}
					</IonText>


				</IonLabel>
				{isActive && (
					<IonBadge color="primary" style={{ textTransform: "none" }}>
						<IonIcon icon={checkmarkCircle} className="ion-margin-end" />
						Active
					</IonBadge>
				)}
				{!isActive && (
					<IonButton color="light" slot="end" fill="clear">
						<IonIcon icon={trashOutline} slot="icon-only" />
					</IonButton>
				)}
			</IonItem>
		);
	};
const robo = (hex?: string) => hex ? `https://robohash.org/${hex}.png?bgset=bg1` : "";
