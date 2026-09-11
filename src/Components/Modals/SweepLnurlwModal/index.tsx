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
import { useNestedSourceSelectModal } from "@/Components/Source/SourceSelectSheet";
import {
	allowOverlayRoles,
	useOverlayCoordinator,
	type Dismiss,
	type OverlayChoice,
	type OverlayOptions,
} from "@/overlay";
import { formatSatoshi } from "@/lib/units";
import type { ParsedLnurlWithdrawInput } from "@/lib/types/parse";
import { createNostrInvoice } from "@/Api/helpers";
import { requestLnurlWithdraw } from "@/lib/lnurl/withdraw";
import { useToast } from "@/lib/contexts/useToast";

export type SweepLnurlwOptions = {
	parsed: ParsedLnurlWithdrawInput;
};

type SweepLnurlwDialogProps = SweepLnurlwOptions & {
	dismiss: Dismiss<OverlayChoice>;
};

function SweepLnurlwDialog({ parsed, dismiss }: SweepLnurlwDialogProps) {
	const sourceViews = useAppSelector(selectSourceViews);
	const favoriteSourceView = useAppSelector(selectFavoriteSourceView);
	const { showToast } = useToast();
	const sourceSelect = useNestedSourceSelectModal();
	const [presentLoading, dismissLoading] = useIonLoading();
	const [selectedSource, setSelectedSource] = useState<SourceView>(
		() => favoriteSourceView ?? sourceViews[0],
	);
	const [busy, setBusy] = useState(false);

	const handleSweep = async () => {
		if (busy) return;
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
			dismiss({ role: "confirm" });
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
				<div className="mt-4">
					<SourceSelectionView
						source={selectedSource}
						showTapToSwitch={false}
						onClick={() => {
							sourceSelect({
								sources: sourceViews,
								selectedSourceId: selectedSource.sourceId,
								title: "Sweep into",
							}).then((result) => {
								if (result.role === "confirm") setSelectedSource(result.data);
							});
						}}
						className="[--background:var(--app-surface-muted)]"
					/>
				</div>
				<div className="mt-12 flex justify-end gap-2">
					<IonButton
						color="medium"
						disabled={busy}
						onClick={() => dismiss({ role: "cancel" })}
					>
						Cancel
					</IonButton>
					<IonButton
						color="primary"
						disabled={busy}
						onClick={() => void handleSweep()}
					>
						Sweep
					</IonButton>
				</div>
			</div>
		</>
	);
}

const sweepOverlay: OverlayOptions = {
	cssClass: "dialog-modal wallet-modal",
	backdropDismiss: false,
	keyboardClose: false,
	canDismiss: allowOverlayRoles("confirm", "cancel"),
};

export function useSweepLnurlwModal() {
	const { tryPresent } = useOverlayCoordinator();

	return useCallback((parsed: ParsedLnurlWithdrawInput) => {
		return tryPresent<OverlayChoice>(
			(dismiss) => <SweepLnurlwDialog parsed={parsed} dismiss={dismiss} />,
			sweepOverlay,
		);
	}, [tryPresent]);
}
