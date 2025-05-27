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
import { globe, informationCircleOutline, person } from "ionicons/icons";
import NoteInput from "./common";
import LnurlInfoDisplay from "@/Components/common/info/lnurlInfoDisplay";
import { InputClassification } from "@/lib/types/parse";


const LnurlCard = ({
	lnurlData,
	note,
	setNote,
}: Omit<CardProps, "invoiceData" | "nofferData" | "feeTiers" | "selectedFeeTier" | "setSelectedFeeTier">) => {
	const isLnurl = lnurlData.type === InputClassification.LNURL_PAY;

	return (
		<>
			<IonCard className="ion-margin-top ion-no-padding send-card">
				<IonCardHeader>
					<IonCardTitle className="send-card-title">
						<IonIcon color="primary" icon={isLnurl ? globe : person} style={{ marginRight: "5px" }} />
						{isLnurl ? "LNURL Pay" : "Lightning address"}
					</IonCardTitle>
					<IonCardSubtitle className="send-card-subtitle">
						Paying <IonText color="primary">{lnurlData.domain}</IonText>
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
