import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import type { TokensData } from "sanctum-sdk";
import { SanctumAuthWidget } from "@/Components/SanctumAuthWidget";
import { ModalDismiss, useAskModal } from "../hooks/useAskModal";
import { closeOutline } from "ionicons/icons";

export type SanctumReauthModalOptions = {
	pubkey: string;
};

type SanctumReauthModalProps = SanctumReauthModalOptions & {
	dismiss: ModalDismiss<TokensData>;
}

export function SanctumReauthModal({
	pubkey: _pubkey,
	dismiss
}: SanctumReauthModalProps) {


	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>
						<div className="text-secondary">
							Reauth to Sanctum
						</div>
					</IonTitle>
					<IonButtons slot="end">

						<IonButton onClick={() => dismiss(null, "cancel")}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div className=" flex flex-col justify-center items-center">
					<IonText className="text-secondary leading-normal tracking-wide text-wrap pt-6 pb-12">
						Your Sanctum session has either expired or been revoked. Please reauth to use this profile.
					</IonText>
					<SanctumAuthWidget onTokensUpdated={(tokens) => dismiss(tokens, "confirm")} />
				</div>


			</IonContent>
			<IonFooter>
				<IonToolbar className="ion-border">
					<div className="px-5 flex justify-end items-center gap-3">
						<IonButton expand="block" fill="solid" color="dark" onClick={() => dismiss(null, "cancel")}>Cancel</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>
		</>
	);
}

export function useAskSanctumReauth() {
	return useAskModal<SanctumReauthModalOptions, TokensData>(SanctumReauthModal, "wallet-modal");
}
