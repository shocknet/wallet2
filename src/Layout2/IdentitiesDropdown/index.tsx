import React, { useState } from "react";
import {
	IonAvatar,
	IonBadge,
	IonButton,
	IonContent,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonLabel,
	IonList,
	IonPopover,
	IonSkeletonText,
	IonText,
	useIonLoading,
	useIonRouter,
} from "@ionic/react";
import {
	checkmarkCircle, personCircleOutline, addOutline,
	trashOutline
} from "ionicons/icons";
import { nip19 } from "nostr-tools";
import { useAppSelector, useAppDispatch } from "@/State/store/hooks";
import { identitiesSelectors, selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
import { switchIdentity } from "@/State/identitiesRegistry/thunks";
import { useGetProfileQuery } from "@/State/api/api";
import { useToast } from "@/lib/contexts/useToast";
import { truncateTextMiddle } from "@/lib/format";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import { RouteComponentProps } from "react-router-dom";


const robo = (hex?: string) => hex ? `https://robohash.org/${hex}.png?bgset=bg1` : "";



const IdentitiesDropdown: React.FC<RouteComponentProps> = (_props) => {


	const dispatch = useAppDispatch();
	const [present, dismiss] = useIonLoading();
	const { showToast } = useToast();
	const router = useIonRouter();

	const all = useAppSelector(identitiesSelectors.selectAll);
	const activeHex = useAppSelector(selectActiveIdentityId);

	const [open, setOpen] = useState(false);
	const [anchorEv, setAnchorEv] = useState<MouseEvent | undefined>(undefined);

	const onOpen = (e: React.MouseEvent<HTMLIonButtonElement>) => {
		setAnchorEv(e.nativeEvent);
		setOpen(true);
	};
	const onClose = () => setOpen(false);

	const onSwitch = async (pubkeyHex: string) => {
		present({
			message: "Switching identity..."
		})
		try {
			await dispatch(switchIdentity(pubkeyHex));
			dismiss();
			router.push("/home", "root", "replace");
		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.message || "An error occured when switching to identity"
			})
		} finally {
			dismiss();
		}
	};


	return (
		<>
			<IonButton
				shape="round"
				fill="clear"
				aria-label="Open identity switcher"
				onClick={onOpen}
			>
				<IonIcon color="light" icon={personCircleOutline} />
			</IonButton>
			<IonPopover
				isOpen={open}
				event={anchorEv}
				onDidDismiss={onClose}
				dismissOnSelect
				className="custom-dropdown-popover"
				size="auto"
				reference="event"
				alignment="end"
				side="bottom"
			>
				<IonContent color="secondary" >
					<IonList className="secondary" lines="none">
						{all.map((id) => (
							<IdentityRow
								key={id.pubkey}
								identity={id}
								activeHex={activeHex}
								onPick={onSwitch}
							/>
						))}
					</IonList>
					<IonItemDivider className="ion-margin-top" style={{ minHeight: "0.5px" }} color="primary"> </IonItemDivider>
					<IonList className="secondary" lines="full">
						<IonItem button routerLink="/identity/overview">
							<IonLabel>
								View profile
							</IonLabel>
						</IonItem>
					</IonList>
					<IonList className="secondary">
						<IonItem button routerLink="/identity/create">

							<IonIcon aria-hidden="true" slot="start" icon={addOutline} />
							<IonLabel>
								Create new identity
							</IonLabel>
						</IonItem>
					</IonList>
				</IonContent>
			</IonPopover>


		</>
	);
};

export default IdentitiesDropdown;





export const IdentityRow: React.FC<{
	identity: Identity;
	activeHex?: string | null;
	onPick: (pubkeyHex: string) => void;
}> = ({ identity, activeHex, onPick }) => {
	const pubkeyHex = identity.pubkey;
	const { data: profile, isLoading } = useGetProfileQuery({
		pubkey: activeHex!,
		relays: identity.type !== IdentityType.SANCTUM ? identity.relays : ["wss//:strfry.shock.network", "wss://relay.lightning.pub"]
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
			onClick={() => !isActive && onPick(pubkeyHex)}
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
