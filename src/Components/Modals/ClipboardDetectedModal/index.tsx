import { IonButton, IonHeader, IonText, IonTitle, IonToolbar } from "@ionic/react";
import { useCallback } from "react";
import {
	allowOverlayRoles,
	useOverlayCoordinator,
	type Dismiss,
	type OverlayChoice,
} from "@/overlay";

export type ClipboardDetectedModalOptions = {
	value: string;
};

type ClipboardDetectedModalProps = ClipboardDetectedModalOptions & {
	dismiss: Dismiss<OverlayChoice>;
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
					<IonButton fill="clear" onClick={() => dismiss({ role: "cancel" })}>
						No
					</IonButton>
					<IonButton onClick={() => dismiss({ role: "confirm" })}>
						Yes
					</IonButton>
				</div>
			</div>
		</>
	);
}

export function useClipboardDetectedModal() {
	const { tryPresent } = useOverlayCoordinator();
	return useCallback((options: ClipboardDetectedModalOptions) => {
		return tryPresent<OverlayChoice>(
			(dismiss) => <ClipboardDetectedModal {...options} dismiss={dismiss} />,
			{
				cssClass: "dialog-modal wallet-modal",
				backdropDismiss: false,
				keyboardClose: false,
				canDismiss: allowOverlayRoles("confirm", "cancel"),
			},
		);
	}, [tryPresent]);
}
