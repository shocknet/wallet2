import { ParsedInvoiceInput } from "@/lib/types/parse";
import { IonItem, IonLabel, IonList, IonNote, IonText } from "@ionic/react";

interface Props {
	invoiceData: ParsedInvoiceInput;
	inset?: boolean;
	labelsColor?: string;
}


const InvoiceInfoDisplay = ({ invoiceData, inset, labelsColor }: Props) => {
	return (
		<IonList inset={inset} className="secondary">
			<IonItem>
				<IonLabel color={labelsColor}>Amount</IonLabel>
				<IonText>{invoiceData.amount?.toLocaleString()} sats</IonText>
			</IonItem>
			{invoiceData.memo && (
				<IonItem>
					<IonLabel color={labelsColor}>
						Description
						<IonNote style={{ display: "block", fontSize: "0.9rem" }} className="ion-text-wrap text-low">{invoiceData.memo}</IonNote>
					</IonLabel>
				</IonItem>
			)}
		</IonList>
	)

}

export default InvoiceInfoDisplay;
