import {
	IonButton,
	IonHeader,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { useState } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { selectFavoriteSourceView, selectSourceViews, SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceSelectionView } from "@/Components/Source/SourceSelectionView";
import { SourceSelectSheet } from "@/Components/Source/SourceSelectSheet";
import { type ModalDismiss, useAskModal } from "@/Components/Modals/hooks/useAskModal";
import { Satoshi } from "@/lib/types/units";
import { formatSatoshi } from "@/lib/units";

export type SweepLnurlwOptions = {
	amount: Satoshi;
};

export type SweepLnurlwResult = {
	selectedSource: SourceView;
};

type SweepLnurlwDialogProps = SweepLnurlwOptions & {
	dismiss: ModalDismiss<SweepLnurlwResult>;
};

function SweepLnurlwDialog({ amount, dismiss }: SweepLnurlwDialogProps) {
	const sourceViews = useAppSelector(selectSourceViews);
	const favoriteSourceView = useAppSelector(selectFavoriteSourceView);
	const [selectedSource, setSelectedSource] = useState(
		() => favoriteSourceView ?? sourceViews[0],
	);
	const [sheetOpen, setSheetOpen] = useState(false);

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-secondary text-lg text-weight-high">
							Sweep LNURL-W
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className="ion-padding bg-[var(--app-surface)]">
				<IonText className="text-muted">
					Choose a source to sweep {formatSatoshi(amount)} sats to.
				</IonText>
				{selectedSource ? (
					<div className="mt-4">
						<SourceSelectionView
							source={selectedSource}
							showTapToSwitch={false}
							onClick={() => setSheetOpen(true)}
							className="[--background:var(--app-surface-muted)]"
						/>
					</div>
				) : null}
				<div className="mt-12 flex justify-end gap-2">
					<IonButton color="medium" onClick={() => dismiss(null, "cancel")}>
						Cancel
					</IonButton>
					<IonButton
						color="primary"
						disabled={!selectedSource}
						onClick={() => {
							if (!selectedSource) return;
							dismiss({ selectedSource }, "confirm");
						}}
					>
						Sweep
					</IonButton>
				</div>
			</div>

			<SourceSelectSheet
				isOpen={sheetOpen}
				onDidDismiss={() => setSheetOpen(false)}
				selectedSourceId={selectedSource?.sourceId}
				onSelect={setSelectedSource}
				sources={sourceViews}
				title="Sweep into"
			/>
		</>
	);
}

export function useAskSweepLnurlw() {
	return useAskModal<SweepLnurlwOptions, SweepLnurlwResult>(
		SweepLnurlwDialog,
		"dialog-modal wallet-modal",
	);
}
