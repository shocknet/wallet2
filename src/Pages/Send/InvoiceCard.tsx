import { flash, informationCircleOutline } from "ionicons/icons";
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
import { useEffect, useState } from "react";
import { getFiatString } from "@/Components/FiatDisplay";
import { useAppSelector } from "@/State/store/hooks";
import { selectFiatCurrency } from "@/State/scoped/backups/identity/slice";


const InvoiceCard = ({
	invoiceData,
	note,
	setNote,
	selectedSource
}: Pick<CardProps, "invoiceData" | "note" | "setNote" | "selectedSource">) => {

	const currency = useAppSelector(selectFiatCurrency);
	const [money, setMoney] = useState("");

	useEffect(() => {
		let alive = true;
		const setFiat = async () => {
			const fiat = await getFiatString(invoiceData.amount, currency);
			if (!alive) return;
			setMoney(fiat)

		}
		setFiat();
		return () => {
			alive = false;
		}
	}, [invoiceData.amount, currency]);

	const hasEnough = (selectedSource?.maxWithdrawableSats || 0 as Satoshi) > invoiceData.amount!

	return (
		<IonCard className="ion-margin-top ion-no-padding send-card">
			<IonCardHeader>
				<IonCardTitle className="send-card-title">
					<IonIcon icon={flash} style={{ color: "orange", marginRight: "5px" }} />
					Lightning Invoice
				</IonCardTitle>
				<IonCardSubtitle className="send-card-subtitle">
					Paying <IonText color="primary">{formatSatoshi(invoiceData.amount || 0 as Satoshi)} Sats</IonText>
					<IonText style={{ fontSize: "0.7rem" }}>{money && ` (~${money})`}</IonText>
					{
						!hasEnough &&
						<IonText color="danger" style={{ fontSize: "0.9rem", display: "block" }} className="ion-margin-top">
							Insufficient funds in selected source
						</IonText>

					}
				</IonCardSubtitle>
			</IonCardHeader>
			<IonCardContent className="ion-padding ion-margin-top">
				<NoteInput note={note} setNote={setNote} className="ion-margin-top" />
				<IonAccordionGroup style={{ marginTop: "30px" }}>
					<IonAccordion value="invoice-info">
						<IonItem slot="header" color="secondary" lines="none">
							<IonLabel><IonIcon icon={informationCircleOutline} /></IonLabel>
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
