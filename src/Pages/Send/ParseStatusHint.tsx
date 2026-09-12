import { IonIcon, IonText } from "@ionic/react";
import { getIconFromClassification } from "@/lib/icons";
import { InputClassification } from "@/lib/types/parse";
import type { BitcoinInputState } from "@/Components/BitcoinInput/BitcoinInput";

export function ParseStatusHint({ state }: { state: BitcoinInputState }) {
	if (state.status !== "loading") return null;

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
