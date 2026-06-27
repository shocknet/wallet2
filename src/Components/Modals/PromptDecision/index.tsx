import { IonButton, IonHeader, IonText, IonTitle, IonToolbar } from "@ionic/react";
import { ModalDismiss, useAskModal } from "../hooks/useAskModal";
import { Color } from "@ionic/core";

interface PromptDecisionModalOptions {
	title: string;
	description?: string;
	descriptionColor?: Color;
	confirmButtonColor?: Color;
	confirmButtonLabel?: string;
	denyButtonColor?: Color;
	denyButtonLabel?: string;
}

type PromptDecisionModalProps = PromptDecisionModalOptions & {
	dismiss: ModalDismiss<boolean>;
};

export function PromptDecisionModal({
	title,
	description,
	descriptionColor,
	confirmButtonColor,
	confirmButtonLabel,
	denyButtonColor,
	denyButtonLabel,
	dismiss,
}: PromptDecisionModalProps) {
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-primary text-lg text-weight-high">
							{title}
						</IonText>
					</IonTitle>

				</IonToolbar>
			</IonHeader>

			<div className="ion-padding bg-[var(--app-surface)]">
				<div className="mb-4">

					<IonText className="ion-text-wrap" color={descriptionColor}>
						{description}
					</IonText>
				</div>
				<div className="flex items-center justify-center gap-2">
					<IonButton color={denyButtonColor} onClick={() => dismiss(null, "cancel")}>{denyButtonLabel}</IonButton>
					<IonButton color={confirmButtonColor} onClick={() => dismiss(true, "confirm")}>{confirmButtonLabel}</IonButton>
				</div>
			</div>


		</>
	);
}

export function useAskPromptDecision() {
	return useAskModal<PromptDecisionModalOptions, boolean>(PromptDecisionModal, "dialog-modal wallet-modal");
}
