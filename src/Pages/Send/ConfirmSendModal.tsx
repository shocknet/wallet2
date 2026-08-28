import { useState } from "react";
import {
	IonButton,
	IonHeader,
	IonInput,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { FiatDisplay } from "@/Components/FiatDisplay";
import { Avatar } from "@/Components/Avatar";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import { type ModalDismiss, useAskModal } from "@/Components/Modals/hooks/useAskModal";
import { truncateTextMiddle } from "@/lib/format";
import { InputClassification, type ParsedInput } from "@/lib/types/parse";
import type { Satoshi } from "@/lib/types/units";
import { formatSatoshi } from "@/lib/units";
import type { SourceView } from "@/State/scoped/backups/sources/selectors";

export type ConfirmSendModalOptions = {
	parsed: ParsedInput;
	amount: Satoshi;
	initialNote?: string;
	source: SourceView;
};

export type ConfirmSendResult = {
	note: string;
};

type ConfirmSendModalProps = ConfirmSendModalOptions & {
	dismiss: ModalDismiss<ConfirmSendResult>;
};

function ConfirmSendModal({
	parsed,
	amount,
	initialNote,
	source,
	dismiss,
}: ConfirmSendModalProps) {
	const [note, setNote] = useState(initialNote ?? "");
	const to = recipientSummary(parsed);

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-lg text-primary text-weight-high">
							Confirm payment
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<div className="ion-padding bg-[var(--app-surface)] max-w-md w-80">
				<div className="flex flex-col items-center text-center">
					<div className="flex items-baseline justify-center gap-1.5">
						<span className="text-4xl font-bold tabular-nums tracking-tight text-primary">
							{formatSatoshi(amount)}
						</span>
						<span className="text-sm font-medium text-muted">sats</span>
					</div>
					<FiatDisplay
						className="mt-1.5 m-0 text-sm text-muted"
						sats={amount}
						sign="~"
					/>
				</div>

				<div className="mt-4 flex flex-col gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
					<div className="flex items-center justify-between gap-3">
						<p className="m-0 shrink-0 text-xs text-secondary">From</p>
						<div className="flex min-w-0 items-center gap-2">
							<Avatar
								id={source.sourceId}
								avatarUrl={source.beaconAvatarUrl}
								size="sm"
							/>
							<p className="m-0 truncate text-sm font-medium text-primary">
								{sourceDisplayName(source)}
							</p>
						</div>
					</div>
					<div className="flex items-baseline justify-between gap-3">
						<p className="m-0 shrink-0 text-xs text-secondary">To</p>
						<div className="min-w-0 text-right">
							<p className="m-0 truncate text-sm font-medium text-primary">
								{to.label}
							</p>
							{to.detail ? (
								<p className="m-0 truncate text-xs text-muted">{to.detail}</p>
							) : null}
						</div>
					</div>
				</div>

				<IonInput
					className="mt-4 filled-input"
					label="Note"
					labelPlacement="stacked"
					fill="solid"
					mode="md"
					placeholder="Optional"
					value={note}
					onIonInput={(e) => setNote(e.detail.value || "")}
				/>

				<div className="mt-5 flex flex-col gap-2">
					<IonButton
						color="primary"
						expand="block"
						className="m-0 [--border-radius:12px]"
						onClick={() => dismiss({ note }, "confirm")}
					>
						Pay {formatSatoshi(amount)} sats
					</IonButton>
					<IonButton
						fill="clear"
						expand="block"
						className="m-0 [--border-radius:12px] [--color:var(--app-text-primary)]"
						onClick={() => dismiss(null, "cancel")}
					>
						Back
					</IonButton>
				</div>
			</div>
		</>
	);
}

export function useAskConfirmSend() {
	return useAskModal<ConfirmSendModalOptions, ConfirmSendResult>(
		ConfirmSendModal,
		"dialog-modal wallet-modal",
	);
}

function recipientSummary(parsed: ParsedInput): { label: string; detail?: string } {
	switch (parsed.type) {
		case InputClassification.LN_INVOICE:
			return {
				label: "Lightning invoice",
				detail: truncateTextMiddle(parsed.data, 10, 8),
			};
		case InputClassification.LNURL_PAY:
			return {
				label: "LNURL Pay",
				detail: parsed.identifier || parsed.domain,
			};
		case InputClassification.LN_ADDRESS:
			return {
				label: "Lightning address",
				detail: parsed.identifier || parsed.data,
			};
		case InputClassification.NOFFER:
			return {
				label: "Noffer",
				detail: truncateTextMiddle(parsed.noffer.offer, 10, 8),
			};
		default:
			return { label: parsed.type };
	}
}
