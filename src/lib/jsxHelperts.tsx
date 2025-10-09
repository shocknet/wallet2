import { InputState } from "@/Pages/Send/types";
import { IonIcon, IonText } from "@ionic/react";
import { getIconFromClassification } from "./icons";
import { InputClassification } from "./types/parse";
import { checkmarkCircle } from "ionicons/icons";

// Helper component to show helper text about parsed recipient
export const RecipentInputHelperText = ({ inputState }: { inputState: InputState }) => {
	switch (inputState.status) {
		case "idle":
			return <div></div>;
		case "loading": {
			const { icon, color } = getIconFromClassification(inputState.classification);
			return (
				<IonText color="primary">
					<p style={{ fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center" }}>
						<IonIcon icon={icon} color={color} style={{ marginRight: "8px" }} />
						{
							inputState.classification === InputClassification.LNURL_PAY ||
								inputState.classification === InputClassification.LN_ADDRESS ||
								inputState.classification === InputClassification.NOFFER
								? `${inputState.classification} detected. Fetching info.`
								: `${inputState.classification} detected. Parsing...`}
					</p>
				</IonText>
			);
		}
		case "parsedOk": {
			return (
				<IonText color="primary">
					<p style={{ fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center" }}>
						{inputState.parsedData.type}
						{
							(inputState.parsedData.type === InputClassification.NPROFILE && inputState.parsedData.adminEnrollToken) &&
							"with admin enroll token"
						}
						<IonIcon icon={checkmarkCircle} color="success" style={{ marginLeft: 8 }} />
					</p>
				</IonText>
			);
		}
	}
}
