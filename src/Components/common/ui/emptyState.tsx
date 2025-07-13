import { IonGrid, IonRow, IonCol, IonIcon, IonText } from "@ionic/react";
import { documentTextOutline } from "ionicons/icons";

interface EmptyStateProps {
	message: string;
	ionicon?: string
}
const EmptyState = ({ message, ionicon }: EmptyStateProps) => (

	<IonGrid className="ion-padding" style={{ height: "100%" }}>
		<IonRow className="ion-justify-content-center ion-align-items-center" style={{ height: "100%" }}>
			<IonCol size="12" className="ion-text-center">
				<IonIcon
					icon={ionicon || documentTextOutline}
					size="large"
					className="text-medium"
					style={{ fontSize: "4rem" }}
				/>
				<IonText className="text-medium">
					<h2
						className="text-xl"
						style={{ marginTop: "0.75rem", fontWeight: 500, lineHeight: "1.4" }}
					>
						{message}
					</h2>
				</IonText>
			</IonCol>
		</IonRow>
	</IonGrid>
);

export default EmptyState;
