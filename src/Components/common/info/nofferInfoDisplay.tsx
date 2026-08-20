import { priceTypeToString } from "@/lib/noffer";
import { ParsedNofferInput } from "@/lib/types/parse";
import { formatSatoshi, satoshi } from "@/lib/units";
import { IonItem, IonLabel, IonList, IonNote, IonText } from "@ionic/react";


interface Props {
	nofferData: ParsedNofferInput;
	inset?: boolean;
	labelsColor?: string;
}


const NofferInfoDisplay = ({ nofferData, inset, labelsColor }: Props) => {
	const price = nofferData.noffer.price;

	return (
		<IonList inset={inset} className="secondary">
			<IonItem>
				<IonLabel color={labelsColor}>
					Offer
					<IonNote style={{ display: "block", fontSize: "0.9rem" }} className="ion-text-wrap text-muted">{nofferData.noffer.offer}</IonNote>
				</IonLabel>
			</IonItem>
			<IonItem>
				<IonLabel color={labelsColor}>Price Type</IonLabel>
				<IonText>{priceTypeToString(nofferData.noffer.priceType)}</IonText>
			</IonItem>
			{
				price != null && (
					<IonItem>
						<IonLabel color={labelsColor}>Price</IonLabel>
						<IonText>{formatSatoshi(satoshi(price))} sats</IonText>
					</IonItem>
				)
			}
			<IonItem>
				<IonLabel color={labelsColor}>
					Pubkey
					<IonNote style={{ display: "block", fontSize: "0.9rem" }} className="ion-text-wrap text-muted">{nofferData.noffer.pubkey}</IonNote>
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
