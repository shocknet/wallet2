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
	IonBadge,
	IonFooter,
} from "@ionic/react";
import { chevronBackOutline, checkmarkCircle, trashOutline } from "ionicons/icons";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";

import { selectSecureIdentities } from "@/State/identitiesRegistry/slice";
import { deleteIdentity, switchIdentity } from "@/State/identitiesRegistry/thunks";
import { useToast } from "@/lib/contexts/useToast";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import { truncateTextMiddle } from "@/lib/format";
import { nip19 } from "nostr-tools";
import { useGetProfileQuery } from "@/State/api/api";
import { RuntimeIdentity } from "@/State/identitiesRegistry/types";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { useUnlockIdentity } from "@/lib/hooks/useUnlockIdentity";
import { useCallback } from "react";
import { BiometryError, BiometryErrorType } from "@aparajita/capacitor-biometric-auth";
import { useAskPromptDecision } from "@/Components/Modals/PromptDecision";


export default function IdentitiesPage() {
	const presentPromptDecision = useAskPromptDecision();
	const { prepareWithUi } = useUnlockIdentity();
	const router = useIonRouter();
	const [present, dismiss] = useIonLoading();
	const all = useAppSelector(selectSecureIdentities);
	const activeIdentityPubkey = useAppSelector(selectActiveIdentity)?.pubkey ?? null;
	const dispatch = useAppDispatch();
	const { showToast } = useToast();






	const onSwitch = useCallback(async (identity: Identity) => {
		if (identity.pubkey === activeIdentityPubkey) {
			return router.push("/identity/overview", "forward", "push")
		}

		let runtimeIdentity: RuntimeIdentity;
		try {
			runtimeIdentity = await prepareWithUi(identity);
		} catch (err: unknown) {
			if (err instanceof BiometryError) {
				if (err.code !== BiometryErrorType.userCancel) {
					showToast({
						color: "danger",
						message: `Failed to unlock identity: ${err.message}`
					});
				}
			} else {
				showToast({
					color: "danger",
					message: `Failed to unlock identity: ${err instanceof Error ? err.message : "An unknown error occurred"}`
				});
			}
			return;
		}

		await present({
			message: "Switching identity..."
		})
		try {
			await dispatch(switchIdentity(runtimeIdentity));
			await dismiss();
			router.push("/sources", "forward", "push");
		} catch (err: unknown) {
			showToast({
				color: "danger",
				message: `Failed to switch to identity: ${err instanceof Error ? err.message : "An unknown error occurred"}`
			})
			await dismiss();
		}
	}, [activeIdentityPubkey, prepareWithUi, router, dispatch, showToast, dismiss, present]);

	const onDelete = useCallback(async (identity: Identity) => {
		if (identity.pubkey === activeIdentityPubkey) return;

		const answer = await presentPromptDecision({
			title: "Delete Profile",
			description: "Are you sure you want to delete this profile? If you don't have a backup, you will lose all your funds in this identity.",
			descriptionColor: "danger",
			confirmButtonColor: "danger",
			confirmButtonLabel: "Delete",
			denyButtonColor: "medium",
			denyButtonLabel: "Cancel",
		});


		if (answer) {
			try {
				await dispatch(deleteIdentity(identity.pubkey));
			} catch (err: unknown) {
				showToast({
					color: "danger",
					message: `Failed to delete identity: ${err instanceof Error ? err.message : "An unknown error occurred"}`
				})
			}

		}
	}, [presentPromptDecision, showToast, dispatch, activeIdentityPubkey]);


	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton routerLink="/home" routerDirection="back">
							<IonIcon icon={chevronBackOutline} />
						</IonButton>
					</IonButtons>
					<IonTitle>Profiles</IonTitle>

				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<IonList lines="full">
					{all.map((id) => (
						<IdentityRow
							key={id.pubkey}
							identity={id}
							activeHex={activeIdentityPubkey}
							onPick={onSwitch}
							onDelete={onDelete}
						/>
					))}
				</IonList>
			</IonContent>
			<IonFooter className="ion-no-border">
				<IonToolbar>
					<div className="w-full px-3 ">

						<IonButton routerLink="/identity/create" fill="solid" className="[--border-radius:12px]" size="large" expand="block" color="primary">
							Add New Profile
						</IonButton>
					</div>

				</IonToolbar>
			</IonFooter>
		</IonPage>
	);
}


const IdentityRow
	= (
		{ identity, activeHex, onPick, onDelete }: {
			identity: Identity;
			activeHex?: string | null;
			onPick: (identity: Identity) => void;
			onDelete: (identity: Identity) => void;
		}
	) => {
		const pubkeyHex = identity.pubkey;
		const { data: profile, isLoading } = useGetProfileQuery({
			pubkey: pubkeyHex,
			relays: identity.type !== IdentityType.SANCTUM ? identity.relays : ["wss://strfry.shock.network", "wss://relay.lightning.pub"]
		},
			{ skip: !pubkeyHex }
		);
		const isActive = activeHex === pubkeyHex;

		const displayName = profile?.display_name || profile?.name || "Anonymous"
		const picture = profile?.picture || robo(pubkeyHex);
		const npub = nip19.npubEncode(pubkeyHex);

		return (
			<IonItem
				button
				detail={false}
				onClick={() => onPick(identity)}
				className="[--background:var(--app-background)]"
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
					<IonText className="text-primary text-md">
						{displayName}
					</IonText>

					<IonText className="ion-margin-top text-secondary code-string" style={{ display: "block" }}>
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
					<IonButton color="danger" slot="end" fill="clear" onClick={(e) => {
						e.stopPropagation();
						onDelete(identity);
					}}>
						<IonIcon icon={trashOutline} slot="icon-only" />
					</IonButton>
				)}
			</IonItem>
		);
	};
const robo = (hex?: string) => hex ? `https://robohash.org/${hex}.png?bgset=bg1` : "";
