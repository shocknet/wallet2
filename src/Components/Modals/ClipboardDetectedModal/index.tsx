import { IonButton, IonHeader, IonText, IonTitle, IonToolbar } from "@ionic/react";
import { ModalDismiss, useAskModal } from "../hooks/useAskModal";

export type ClipboardDetectedModalOptions = {
	value: string;
};

type ClipboardDetectedModalProps = ClipboardDetectedModalOptions & {
	dismiss: ModalDismiss<true>;
};

export function ClipboardDetectedModal({
	value,
	dismiss,
}: ClipboardDetectedModalProps) {
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-primary text-lg font-semibold">
							Clipboard detected
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className="ion-padding bg-[var(--app-surface)]">
				<p className="m-0 mb-2 text-sm text-muted">
					Use this from your clipboard?
				</p>
				<p
					className="
						code-string m-0 mb-5 max-h-40 overflow-y-auto
						break-all whitespace-pre-wrap text-sm leading-5 text-primary
					"
				>
					{value}
				</p>
				<div className="flex items-center justify-center gap-2">
					<IonButton fill="clear" onClick={() => dismiss(null, "cancel")}>
						No
					</IonButton>
					<IonButton onClick={() => dismiss(true, "confirm")}>
						Yes
					</IonButton>
				</div>
			</div>
		</>
	);
}

export function useAskClipboardDetected() {
	return useAskModal<ClipboardDetectedModalOptions, true>(
		ClipboardDetectedModal,
		"dialog-modal wallet-modal",
	);
}
