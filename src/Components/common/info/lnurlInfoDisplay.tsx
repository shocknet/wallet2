import { ParsedLightningAddressInput, ParsedLnurlPayInput } from "@/lib/types/parse";
import { IonContent, IonItem, IonLabel, IonList, IonModal, IonNote, IonText, IonThumbnail } from "@ionic/react";
import { useState } from "react";

interface Props {
	lnurlData: ParsedLnurlPayInput | ParsedLightningAddressInput;
	inset?: boolean;
	labelsColor?: string;
}


const LnurlInfoDisplay = ({ lnurlData, inset, labelsColor }: Props) => {
	const [expandImage, setExpandImage] = useState(false);
	return (
		<>
			<IonList inset={inset}>
				<IonItem>
					<IonLabel>
						<IonText className="text-medium">
							Amount Range
						</IonText>
					</IonLabel>
					<IonText className="text-low">{lnurlData.min.toLocaleString()} - {lnurlData.max.toLocaleString()} sats</IonText>
				</IonItem>
				{lnurlData.identifier && (
					<IonItem>
						<IonLabel color={labelsColor}>
							<IonText className="text-medium">
								Identifier
							</IonText>
						</IonLabel>
						<IonText className="text-low">{lnurlData.identifier}</IonText>
					</IonItem>
				)}
				{lnurlData.description && (
					<IonItem >
						<IonLabel>
							<IonText className="text-medium">
								Description
							</IonText>
							<IonNote style={{ display: "block" }} className="ion-text-wrap text-low ion-margin-top">{lnurlData.description}</IonNote>
						</IonLabel>
					</IonItem>
				)}
				{lnurlData.image && (
					<IonItem onClick={() => setExpandImage(true)} button>
						<IonLabel>
							Image
							<IonNote style={{ display: "block", fontSize: "0.7rem" }} className="text-low">(Tap to expand)</IonNote>
						</IonLabel>
						<IonThumbnail>
							<img src={lnurlData.image} alt="LNURL Pay Merchant" />
						</IonThumbnail>
					</IonItem>
				)}
			</IonList>
			<IonModal className="image-modal" isOpen={expandImage} onDidDismiss={() => setExpandImage(false)}>
				<IonContent scrollY={false}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '100%',
							backgroundColor: 'none'
						}}
						onClick={() => setExpandImage(false)}
					>
						<img
							src={lnurlData.image}
							style={{
								width: `100%`,
								height: `auto`,
								maxWidth: '100vw',
								maxHeight: '100vh',
								objectFit: 'contain',
								pointerEvents: 'none'
							}}
						/>
					</div>
				</IonContent>
			</IonModal>
		</>
	)
}

export default LnurlInfoDisplay;
