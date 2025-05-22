import { CardProps } from "./types";
import {
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonCol,
	IonGrid,
	IonIcon,
	IonRange,
	IonRow,
	IonText
} from "@ionic/react";
import { logoBitcoin } from "ionicons/icons";
import { useEffect, useRef } from "react";





const OnChainCard = ({
	selectedFeeTier,
	setSelectedFeeTier,
	feeTiers,
}: Omit<CardProps, "note" | "setNote" | "lnurlData" | "invoiceData" | "nofferData">) => {
	const currentTier = feeTiers[selectedFeeTier];

	const satsInputRef = useRef<HTMLIonInputElement>(null);

	useEffect(() => {
		const timeout = setTimeout(() => {
			satsInputRef.current?.setFocus();
		}, 50);

		return () => clearTimeout(timeout);
	}, []);


	return (
		<IonCard className="ion-margin-top ion-no-padding send-card">
			<IonCardHeader>
				<IonCardTitle className="send-card-title">
					<IonIcon icon={logoBitcoin} style={{ color: "orange", marginRight: "5px" }} />
					On Chain
				</IonCardTitle>
			</IonCardHeader>
			<IonCardContent className="ion-padding ion-margin-top">
				<IonGrid className="ion-no-padding">
					<IonRow>
						<IonCol>
							<IonText style={{ fontSize: "0.9rem", color: "var(--ion-text-color-step-200)" }}>Fee Rate</IonText>
						</IonCol>
					</IonRow>
					<IonRow>
						<IonCol>
							<IonText style={{ fontSize: "0.8rem", color: "var(--ion-text-color-step-250)" }}>Choose your preferred fee rate</IonText>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-center">
						<IonCol size="12">
							<IonRange
								style={{ display: "block", width: "100%" }}
								value={selectedFeeTier}
								min={0}
								max={2}
								step={1}
								pin
								pinFormatter={(value) => feeTiers[value].label}
								snaps
								ticks
								onIonChange={e => setSelectedFeeTier(e.detail.value as number)}
							>
							</IonRange>
						</IonCol>
					</IonRow>
					<IonRow>
						<IonCol>
							<IonText class="ion-text-center" style={{ display: "block", color: "var(--ion-text-color-step-150)" }}>
								<h2 style={{ marginTop: "15px" }}>{currentTier?.description}</h2>
								<p>Selected: {currentTier?.rate} sat/vB</p>
							</IonText>
						</IonCol>
					</IonRow>
				</IonGrid>

			</IonCardContent>
		</IonCard>
	)
}


export default OnChainCard;
