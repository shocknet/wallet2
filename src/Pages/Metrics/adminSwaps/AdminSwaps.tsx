import { useState } from "react"
import { toast } from "react-toastify";
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonInput, IonItem, IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { flashOutline } from "ionicons/icons";
import { DashBoardPageChrome } from "@/Layout2/Metrics/DashBoardPageChrome";
import { useDashboardSource } from "../DashboardSourceContext";
import type { AppApiError } from "@/State/api/api";
import { useBumpTxMutation } from "../pubDashApi";
import TxSwaps from "./TxSwaps";
import SubmarineSwaps from "./SubmarineSwaps";

function BumpTxSection() {
	const { sourceId } = useDashboardSource();
	const [txid, setTxid] = useState("");
	const [outputIndex, setOutputIndex] = useState("");
	const [satPerVbyte, setSatPerVbyte] = useState("");
	const [bumpTx, { isLoading }] = useBumpTxMutation();

	const onBump = async () => {
		const outIdx = parseInt(outputIndex, 10);
		const sats = parseFloat(satPerVbyte);
		if (!txid.trim() || isNaN(outIdx) || outIdx < 0 || isNaN(sats) || sats <= 0) {
			toast.error("Enter valid txid, output index (≥0), and sat/vB (>0)");
			return;
		}
		try {
			await bumpTx({
				sourceId,
				txid: txid.trim(),
				output_index: outIdx,
				sat_per_vbyte: sats,
			}).unwrap();
			toast.success("Tx bump requested.");
			setTxid("");
			setOutputIndex("");
			setSatPerVbyte("");
		} catch (e) {
			toast.error((e as AppApiError).message || "Failed to bump tx");
		}
	};

	return (
		<>
			<IonCard>
				<IonCardHeader>
					<IonCardTitle>Bump transaction fee (RBF)</IonCardTitle>
				</IonCardHeader>
				<IonCardContent>
					<IonItem lines="none">
						<IonInput
							label="Txid"
							labelPlacement="stacked"
							value={txid}
							onIonInput={(e) => setTxid(e.detail.value ?? "")}
							placeholder="hex txid"
							className="ion-margin-bottom"
						/>
					</IonItem>
					<IonItem lines="none">
						<IonInput
							label="Output index"
							labelPlacement="stacked"
							type="number"
							min={0}
							value={outputIndex}
							onIonInput={(e) => setOutputIndex(e.detail.value ?? "")}
							placeholder="0"
						/>
					</IonItem>
					<IonItem lines="none">
						<IonInput
							label="Sat per vB"
							labelPlacement="stacked"
							type="number"
							min={0}
							step="any"
							value={satPerVbyte}
							onIonInput={(e) => setSatPerVbyte(e.detail.value ?? "")}
							placeholder="e.g. 10"
						/>
					</IonItem>
					<IonButton expand="block" onClick={() => void onBump()} disabled={isLoading || !txid.trim() || outputIndex === "" || satPerVbyte === ""}>
						<IonIcon icon={flashOutline} slot="start" /> {isLoading ? "Bumping…" : "Bump Tx"}
					</IonButton>
				</IonCardContent>
			</IonCard>
		</>
	);
}

export default function AdminSwaps() {
	const [selectedView, setSelectedView] = useState("reverse");

	return (
		<DashBoardPageChrome
			title="Swaps"
			headerExtra={
				<IonSegment value={selectedView} onIonChange={(e) => setSelectedView(e.detail.value?.toString() ?? "reverse")}>
					<IonSegmentButton value="reverse">
						<IonLabel>Reverse Swaps</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="submarine">
						<IonLabel>Submarine Swaps</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="bump">
						<IonLabel>Bump Tx</IonLabel>
					</IonSegmentButton>
				</IonSegment>
			}
		>
			{selectedView === "reverse" && <TxSwaps />}
			{selectedView === "submarine" && <SubmarineSwaps />}
			{selectedView === "bump" && <BumpTxSection />}
		</DashBoardPageChrome>
	);
}
