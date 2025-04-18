import { CardProps } from "./types";
import {
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonNote,
	IonRange,
	IonText
} from "@ionic/react";

import { Satoshi } from "@/lib/types/units";
import AmountInput from "@/Components/AmountInput";
import { parseUserInputToSats } from "@/lib/units";
import { logoBitcoin } from "ionicons/icons";





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

	return (
		<IonCard color="secondary" className="ion-no-margin ion-no-padding">
			<IonCardHeader>
				<IonCardTitle>
					<IonIcon icon={logoBitcoin} style={{ color: "orange", marginRight: "5px" }} />
					On Chain
				</IonCardTitle>
			</IonCardHeader>
			<IonCardContent className="ion-no-padding">
				<AmountInput
					labelPlacement="stacked"
					amountInSats={amountInSats}
					setAmountInSats={setAmountInSats}
					unit={unit}
					setUnit={setUnit}
					displayValue={displayValue}
					setDisplayValue={setDisplayValue}
					fill="solid"
					className="ion-margin card-input"
					limits={{ minSats: 1 as Satoshi, maxSats: parseUserInputToSats(selectedSource?.maxWithdrawable || "0", "sats") }}
				/>
				<IonList inset lines="none">
					<IonItem>
						<IonLabel>
							Fee Rate
							<IonNote color="medium" style={{ display: "block" }}>
								Choose your preferred fee rate
							</IonNote>
						</IonLabel>
					</IonItem>
					<IonItem>
						<IonRange
							style={{ display: "block", width: "80%" }}
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
					</IonItem>
				</IonList>
				<IonText class="ion-text-center" style={{ display: "block" }}>
					<h2 style={{ marginTop: "15px" }}>{currentTier?.description}</h2>
					<p>Selected: {currentTier?.rate} sat/vB</p>
				</IonText>
			</IonCardContent>
		</IonCard>
	)
}


export default OnChainCard;