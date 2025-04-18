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

import { Satoshi } from "@/lib/types/units";
import NoteInput from "./common";
import { nip19 } from "nostr-tools";
import AmountInput from "@/Components/AmountInput";
import { parseUserInputToSats } from "@/lib/units";
import NofferInfoDisplay from "@/Components/common/info/nofferInfoDisplay";




const NofferCard = ({
	nofferData,
	amountInSats,
	setAmountInSats,
	displayValue,
	setDisplayValue,
	unit,
	setUnit,
	note,
	setNote,
	selectedSource
}: Omit<CardProps, "invoiceData" | "lnurlData" | "feeTiers" | "selectedFeeTier" | "setSelectedFeeTier">) => {

	return (
		<>
			<IonCard color="secondary">
				<IonCardHeader>
					<IonCardTitle style={{ display: "flex", alignItems: "center" }}>
						<IonIcon color="primary" icon="nostr" style={{ marginRight: "5px" }} />
						Noffer
					</IonCardTitle>
					<IonCardSubtitle>
						Paying <IonText color="primary">{nofferData.noffer.offer}</IonText>
					</IonCardSubtitle>
				</IonCardHeader>
				<IonCardContent className="ion-no-padding">
					{
						(nofferData.priceType === nip19.OfferPriceType.Spontaneous)
						&&
						<AmountInput
							labelPlacement="stacked"
							amountInSats={amountInSats}
							setAmountInSats={setAmountInSats}
							unit={unit}
							setUnit={setUnit}
							displayValue={displayValue}
							setDisplayValue={setDisplayValue}
							limits={{
								minSats: 1 as Satoshi,
								maxSats: parseUserInputToSats(selectedSource?.maxWithdrawable || "0", "sats")
							}}
							className="card-input ion-margin"
							fill="solid"
						/>
					}

					<NoteInput note={note} setNote={setNote} />

					<IonAccordionGroup className="ion-margin">
						<IonAccordion value="lnurl-info">
							<IonItem slot="header">
								<IonLabel>Noffer Info</IonLabel>
							</IonItem>
							<div slot="content">
								<NofferInfoDisplay nofferData={nofferData} />
							</div>
						</IonAccordion>
					</IonAccordionGroup>





				</IonCardContent>
			</IonCard>
		</>
	);
}

export default NofferCard;