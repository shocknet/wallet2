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

import NoteInput from "./common";
import NofferInfoDisplay from "@/Components/common/info/nofferInfoDisplay";
import { informationCircleOutline } from "ionicons/icons";




const NofferCard = ({
	nofferData,
	note,
	setNote,
}: Omit<CardProps, "invoiceData" | "lnurlData" | "feeTiers" | "selectedFeeTier" | "setSelectedFeeTier" | "selectedSource">) => {

	return (
		<>
			<IonCard className="ion-margin-top ion-no-padding send-card">
				<IonCardHeader>
					<IonCardTitle className="send-card-title">
						<IonIcon color="primary" icon="nostr" style={{ marginRight: "5px" }} />
						Noffer
					</IonCardTitle>
					<IonCardSubtitle className="send-card-subtitle">
						Paying offer <IonText>{nofferData.noffer.offer}</IonText>
					</IonCardSubtitle>
				</IonCardHeader>
				<IonCardContent className="ion-padding ion-margin-top">
					<NoteInput note={note} setNote={setNote} className="ion-margin-top" />

					<IonAccordionGroup style={{ marginTop: "30px" }}>
						<IonAccordion value="lnurl-info">
							<IonItem slot="header" color="secondary" lines="none">
								<IonLabel><IonIcon icon={informationCircleOutline} /></IonLabel>
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
