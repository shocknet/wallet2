import { CardProps } from "./types";
import {
	IonAccordion,
	IonAccordionGroup,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonIcon,
	IonItem,
	IonLabel,
	IonText
} from "@ionic/react";
import { globe, person } from "ionicons/icons";
import AmountInput from "@/Components/AmountInput";
import { parseUserInputToSats } from "@/lib/units";
import { Satoshi } from "@/lib/types/units";
import NoteInput from "./common";
import LnurlInfoDisplay from "@/Components/common/info/lnurlInfoDisplay";
import { InputClassification } from "@/lib/types/parse";
import { useEffect, useRef } from "react";

const LnurlCard = ({
	lnurlData,
	amountInSats,
	setAmountInSats,
	displayValue,
	setDisplayValue,
	unit,
	setUnit,
	note,
	setNote,
	selectedSource
}: Omit<CardProps, "invoiceData" | "nofferData" | "feeTiers" | "selectedFeeTier" | "setSelectedFeeTier">) => {
	const isLnurl = lnurlData.type === InputClassification.LNURL_PAY;

	const satsInputRef = useRef<HTMLIonInputElement>(null);

	useEffect(() => {
		const timeout = setTimeout(() => {
			satsInputRef.current?.setFocus();
		}, 50);

		return () => clearTimeout(timeout);
	}, []);


	return (
		<>
			<IonCard color="secondary" className="ion-margin-top ion-no-padding">
				<IonCardHeader>
					<IonCardTitle style={{ display: "flex", alignItems: "center" }}>
						<IonIcon color="primary" icon={isLnurl ? globe : person} style={{ marginRight: "5px" }} />
						{isLnurl ? "LNURL Pay" : "Lightning address"}
					</IonCardTitle>
					<IonCardSubtitle>
						Paying <IonText color="primary">{lnurlData.domain}</IonText>
					</IonCardSubtitle>
				</IonCardHeader>
				<IonCardContent className="ion-padding">
					<AmountInput
						ref={satsInputRef}
						labelPlacement="stacked"
						amountInSats={amountInSats}
						setAmountInSats={setAmountInSats}
						unit={unit}
						setUnit={setUnit}
						displayValue={displayValue}
						setDisplayValue={setDisplayValue}
						limits={{
							minSats: lnurlData.min,
							maxSats: Math.min(lnurlData.max, parseUserInputToSats(selectedSource.maxWithdrawable || "0", "sats")) as Satoshi
						}}
						className="card-input ion-padding"
					/>

					<NoteInput note={note} setNote={setNote} className="ion-margin-top" />
					<IonAccordionGroup className="ion-no-padding" style={{ marginTop: "30px" }}>
						<IonAccordion value="lnurl-info">
							<IonItem slot="header">
								<IonLabel>Lnurl Info</IonLabel>
							</IonItem>
							<div slot="content">
								<LnurlInfoDisplay lnurlData={lnurlData} />
							</div>
						</IonAccordion>
					</IonAccordionGroup>






				</IonCardContent>
			</IonCard>
		</>
	);
}

export default LnurlCard;
