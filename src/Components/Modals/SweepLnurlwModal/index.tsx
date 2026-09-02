import {
	IonButton,
	IonHeader,
	IonText,
	IonTitle,
	IonToolbar,
	useIonLoading,
} from "@ionic/react";
import { useCallback, useState } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { selectFavoriteSourceView, selectSourceViews, SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceSelectionView } from "@/Components/Source/SourceSelectionView";
import { SourceSelectSheet } from "@/Components/Source/SourceSelectSheet";
import { type ModalDismiss, useAskModal } from "@/Components/Modals/hooks/useAskModal";
import { formatSatoshi } from "@/lib/units";
import type { ParsedLnurlWithdrawInput } from "@/lib/types/parse";
import { createNostrInvoice } from "@/Api/helpers";
import { requestLnurlWithdraw } from "@/lib/lnurl/withdraw";
import { useToast } from "@/lib/contexts/useToast";

export type SweepLnurlwOptions = {
	parsed: ParsedLnurlWithdrawInput;
};

type SweepLnurlwDialogProps = SweepLnurlwOptions & {
	dismiss: ModalDismiss<true>;
};

function SweepLnurlwDialog({ parsed, dismiss }: SweepLnurlwDialogProps) {
	const sourceViews = useAppSelector(selectSourceViews);
	const favoriteSourceView = useAppSelector(selectFavoriteSourceView);
	const { showToast } = useToast();
	const [presentLoading, dismissLoading] = useIonLoading();
	const [selectedSource, setSelectedSource] = useState<SourceView | undefined>(
		() => favoriteSourceView ?? sourceViews[0],
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [busy, setBusy] = useState(false);

	const handleSweep = async () => {
		if (!selectedSource || busy) return;
		setBusy(true);
		try {
			await presentLoading({ message: "Sweeping…", cssClass: "app-loading" });
			const parsedInvoice = await createNostrInvoice(
				{ pubkey: selectedSource.lpk, relays: selectedSource.relays },
				selectedSource.keys,
				parsed.max,
			);
			await requestLnurlWithdraw({
				lnurl: parsed.data,
				invoice: parsedInvoice.data,
				amountSats: parsed.max,
				passedParams: parsed,
			});
			dismiss(true, "confirm");
		} catch (err: unknown) {
			showToast({
				message: err instanceof Error ? err.message : "An error occured while sweeping lnurl-w",
				color: "danger",
			});
		} finally {
			await dismissLoading();
			setBusy(false);
		}
	};

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
					Choose a source to sweep {formatSatoshi(parsed.max)} sats to.
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
					<IonButton
						color="medium"
						disabled={busy}
						onClick={() => dismiss(null, "cancel")}
					>
						Cancel
					</IonButton>
					<IonButton
						color="primary"
						disabled={!selectedSource || busy}
						onClick={() => void handleSweep()}
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
	const present = useAskModal<SweepLnurlwOptions, true>(
		SweepLnurlwDialog,
		"dialog-modal wallet-modal",
	);
	const sourceCount = useAppSelector(selectSourceViews).length;
	const { showToast } = useToast();

	return useCallback(async (parsed: ParsedLnurlWithdrawInput) => {
		if (sourceCount === 0) {
			showToast({ message: "Add a source first", color: "danger" });
			return;
		}
		if (parsed.max <= 0) return;

		await present(
			{ parsed },
			{
				backdropDismiss: false,
				keyboardClose: false,
				canDismiss: (_, role) => Promise.resolve(role === "confirm" || role === "cancel"),
			},
		);
	}, [present, showToast, sourceCount]);
}
