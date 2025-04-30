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
import { useSelector } from "@/State/store";
import { useEffect, useState } from "react";
import { convertSatsToFiat } from "@/lib/fiat";
import { formatFiat } from "@/lib/format";


const InvoiceCard = ({
	invoiceData,
	note,
	setNote,
}: Pick<CardProps, "invoiceData" | "note" | "setNote">) => {

	const { url, currency } = useSelector(state => state.prefs.FiatUnit);
	const [money, setMoney] = useState("");

	useEffect(() => {
		const setFiat = async () => {
			if (!invoiceData.amount) {
				setMoney("");
				return;
			}
			const fiat = await convertSatsToFiat(invoiceData.amount, currency, url);
			setMoney(formatFiat(fiat, currency));
		}
		setFiat();
	}, [invoiceData.amount, currency, url]);

	return (
		<IonCard color="secondary" className="ion-margin-top ion-no-padding">
			<IonCardHeader>
				<IonCardTitle style={{ display: "flex", alignItems: "center" }}>
					<IonIcon icon={flash} style={{ color: "orange", marginRight: "5px" }} />
					Lightning Invoice
				</IonCardTitle>
				<IonCardSubtitle>
					Paying <IonText color="primary">{formatSatoshi(invoiceData.amount || 0 as Satoshi)} Sats</IonText>
					<IonText style={{ fontSize: "0.7rem" }}>{money && ` (~${money})`}</IonText>
				</IonCardSubtitle>
			</IonCardHeader>
			<IonCardContent className="ion-padding ion-margin-top">
				<NoteInput note={note} setNote={setNote} />
				<IonAccordionGroup className="ion-no-padding" style={{ marginTop: "30px" }}>
					<IonAccordion value="invoice-info">
						<IonItem slot="header">
							<IonLabel>Invoice info</IonLabel>
						</IonItem>
						<div slot="content">
							<InvoiceInfoDisplay invoiceData={invoiceData} inset />
						</div>
					</IonAccordion>
				</IonAccordionGroup>
			</IonCardContent>
		</IonCard>
	);
}
export default InvoiceCard;
