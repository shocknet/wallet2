import { IonButton, IonHeader, IonText, IonTitle, IonToolbar } from "@ionic/react";
import { useCallback } from "react";
import { useOverlayCoordinator, type Dismiss, type OverlayChoice } from "@/overlay";
import { lockedPromptOverlay } from "./overlay";

export type PromptDecisionOptions = {
	title: string;
	description?: string;
	confirmButtonLabel?: string;
	denyButtonLabel?: string;
};

type PromptDecisionProps = PromptDecisionOptions & {
	dismiss: Dismiss<OverlayChoice>;
};

function PromptDecisionModal({
	title,
	description,
	confirmButtonLabel = "Confirm",
	denyButtonLabel = "Cancel",
	dismiss,
}: PromptDecisionProps) {
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-lg font-semibold text-primary">
							{title}
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className="ion-padding bg-[var(--app-surface)] min-w-[20rem]">
				{description ? (
					<p className="m-0 text-sm leading-5 text-muted">
						{description}
					</p>
				) : null}
				<div className="mt-5 flex justify-end gap-2">
					<IonButton fill="clear" className="m-0" onClick={() => dismiss({ role: "cancel" })}>
						{denyButtonLabel}
					</IonButton>
					<IonButton fill="clear" className="m-0" onClick={() => dismiss({ role: "confirm" })}>
						{confirmButtonLabel}
					</IonButton>
				</div>
			</div>
		</>
	);
}

const promptOverlay = lockedPromptOverlay();

export function usePromptDecisionModal() {
	const { present } = useOverlayCoordinator();
	return useCallback((options: PromptDecisionOptions) => {
		return present<OverlayChoice>(
			(dismiss) => <PromptDecisionModal {...options} dismiss={dismiss} />,
			promptOverlay,
		);
	}, [present]);
}

export function useTryPromptDecisionModal() {
	const { tryPresent } = useOverlayCoordinator();
	return useCallback((options: PromptDecisionOptions) => {
		return tryPresent<OverlayChoice>(
			(dismiss) => <PromptDecisionModal {...options} dismiss={dismiss} />,
			promptOverlay,
		);
	}, [tryPresent]);
}
