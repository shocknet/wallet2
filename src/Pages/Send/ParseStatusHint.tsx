import { IonIcon, IonText } from "@ionic/react";
import { checkmarkCircle } from "ionicons/icons";
import { getIconFromClassification } from "@/lib/icons";
import { InputClassification } from "@/lib/types/parse";
import type { RecipentParseState } from "./types";

/** Identify / fetch status under a paste field (invoice, nprofile, LNURL, …). */
export function ParseStatusHint({ state }: { state: RecipentParseState }) {
	switch (state.status) {
		case "idle":
		case "error":
			return null;
		case "loading": {
			const { icon, color } = getIconFromClassification(state.classification);
			return (
				<IonText color="primary">
					<p style={{ fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center" }}>
						<IonIcon icon={icon} color={color} style={{ marginRight: "8px" }} />
						{
							state.classification === InputClassification.LNURL_PAY ||
								state.classification === InputClassification.LN_ADDRESS
								? `${state.classification} detected. Fetching info.`
								: `${state.classification} detected. Parsing...`}
					</p>
				</IonText>
			);
		}
		case "parsedOk": {
			return (
				<IonText color="primary">
					<p style={{ fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center" }}>
						{state.parsedData.type}
						{
							(state.parsedData.type === InputClassification.NPROFILE && state.parsedData.adminEnrollToken) &&
							" with admin enroll token"
						}
						<IonIcon icon={checkmarkCircle} color="success" style={{ marginLeft: 8 }} />
					</p>
				</IonText>
			);
		}
	}
}
