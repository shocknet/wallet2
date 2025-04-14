import { flash } from "ionicons/icons";
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
import { formatSatoshi } from "@/lib/units";
import { Satoshi } from "@/lib/types/units";
import NoteInput from "./common";
import InvoiceInfoDisplay from "@/Components/common/info/invoiceInfoDisplay";


const InvoiceCard = ({
	invoiceData,
	note,
	setNote,
}: Pick<CardProps, "invoiceData" | "note" | "setNote">) => {
	return (
		<IonCard color="secondary" className="ion-no-margin ion-no-padding">
			<IonCardHeader>
				<IonCardTitle style={{ display: "flex", alignItems: "center" }}>
					<IonIcon icon={flash} style={{ color: "orange", marginRight: "5px" }} />
					Lightning Invoice
				</IonCardTitle>
				<IonCardSubtitle>
					Paying <IonText color="primary">{formatSatoshi(invoiceData.amount || 0 as Satoshi)} Sats</IonText>
				</IonCardSubtitle>
			</IonCardHeader>
			<IonCardContent className="ion-no-padding">
				<NoteInput note={note} setNote={setNote} />
				<IonAccordionGroup className="ion-margin">
					<IonAccordion value="invoice-info">
						<IonItem slot="header">
							<IonLabel>Invoice info</IonLabel>
						</IonItem>
						<div slot="content">
							<InvoiceInfoDisplay invoiceData={invoiceData} />
						</div>
					</IonAccordion>
				</IonAccordionGroup>
			</IonCardContent>
		</IonCard>
	);
}
export default InvoiceCard;