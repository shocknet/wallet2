import { priceTypeToString } from "@/lib/noffer";
import { ParsedNofferInput } from "@/lib/types/parse";
import { formatSatoshi } from "@/lib/units";
import { IonItem, IonLabel, IonList, IonNote, IonText } from "@ionic/react";


interface Props {
	nofferData: ParsedNofferInput;
	inset?: boolean;
	labelsColor?: string;
}


const NofferInfoDisplay = ({ nofferData, inset, labelsColor }: Props) => {
	return (
		<IonList inset={inset} className="secondary">
			<IonItem>
				<IonLabel color={labelsColor}>
					Offer
					<IonNote style={{ display: "block", fontSize: "0.9rem" }} className="ion-text-wrap text-low">{nofferData.noffer.offer}</IonNote>
				</IonLabel>
			</IonItem>
			<IonItem>
				<IonLabel color={labelsColor}>Price Type</IonLabel>
				<IonText>{priceTypeToString(nofferData.priceType)}</IonText>
			</IonItem>
			{
				nofferData.invoiceData && (
					<IonItem>
						<IonLabel color={labelsColor}>Price</IonLabel>
						<IonText>{formatSatoshi(nofferData.invoiceData.amount!)} sats</IonText>
					</IonItem>
				)
			}
			<IonItem>
				<IonLabel color={labelsColor}>
					Pubkey
					<IonNote style={{ display: "block", fontSize: "0.9rem" }} className="ion-text-wrap text-low">{nofferData.noffer.pubkey}</IonNote>
				</IonLabel>
			</IonItem>
			<IonItem>
				<IonLabel color={labelsColor}>Relay</IonLabel>
				<IonText>{nofferData.noffer.relay}</IonText>
			</IonItem>


		</IonList>
	)
}

export default NofferInfoDisplay;
