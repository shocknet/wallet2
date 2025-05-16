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

import { Satoshi } from "@/lib/types/units";
import AmountInput from "@/Components/AmountInput";
import { parseUserInputToSats } from "@/lib/units";
import { logoBitcoin } from "ionicons/icons";
import { useEffect, useRef } from "react";





const OnChainCard = ({
	amountInSats,
	setAmountInSats,
	displayValue,
	setDisplayValue,
	unit,
	setUnit,
	selectedFeeTier,
	setSelectedFeeTier,
	feeTiers,
	selectedSource
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
		<IonCard color="secondary" className="ion-margin-top ion-no-padding">
			<IonCardHeader>
				<IonCardTitle>
					<IonIcon icon={logoBitcoin} style={{ color: "orange", marginRight: "5px" }} />
					On Chain
				</IonCardTitle>
			</IonCardHeader>
			<IonCardContent className="ion-padding ion-margin-top">
				<AmountInput
					ref={satsInputRef}
					labelPlacement="stacked"
					amountInSats={amountInSats}
					setAmountInSats={setAmountInSats}
					unit={unit}
					setUnit={setUnit}
					displayValue={displayValue}
					setDisplayValue={setDisplayValue}
					className="ion-padding card-input"
					limits={{ minSats: 1 as Satoshi, maxSats: parseUserInputToSats(selectedSource?.maxWithdrawable || "0", "sats") }}
				/>
				<IonGrid className="ion-margin-top ion-no-padding">
					<IonRow>
						<IonCol>
							<IonText style={{ fontSize: "0.7rem" }}>Fee Rate</IonText>
						</IonCol>
					</IonRow>
					<IonRow>
						<IonCol>
							<IonText style={{ fontSize: "0.8rem", opacity: "0.7" }}>Choose your preferred fee rate</IonText>
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
							<IonText class="ion-text-center" style={{ display: "block" }}>
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
