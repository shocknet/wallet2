import { IonButton, IonHeader, IonText, IonTitle, IonToolbar } from "@ionic/react";
import { useCallback } from "react";
import { useOverlayCoordinator, usePromiseModal, type Dismiss, type OverlayChoice } from "@/overlay";
import { lockedPromptOverlay } from "./overlay";

export type PromptDangerOptions = {
	title: string;
	description?: string;
	confirmButtonLabel?: string;
	denyButtonLabel?: string;
};

type PromptDangerProps = PromptDangerOptions & {
	dismiss: Dismiss<OverlayChoice>;
};

function PromptDangerModal({
	title,
	description,
	confirmButtonLabel = "Confirm",
	denyButtonLabel = "Cancel",
	dismiss,
}: PromptDangerProps) {
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
					<p className="text-sm leading-5 text-[var(--ion-color-danger-tint)]">
						{description}
					</p>
				) : null}
				<div className="mt-5 flex justify-end gap-2">
					<IonButton fill="clear" className="m-0" onClick={() => dismiss({ role: "cancel" })}>
						{denyButtonLabel}
					</IonButton>
					<IonButton
						fill="clear"
						className="m-0"
						color="danger"
						onClick={() => dismiss({ role: "confirm" })}
					>
						{confirmButtonLabel}
					</IonButton>
				</div>
			</div>
		</>
	);
}

const dangerOverlay = lockedPromptOverlay("prompt-danger-modal");

export function usePromptDangerModal() {
	const { present } = useOverlayCoordinator();
	return useCallback((options: PromptDangerOptions) => {
		return present<OverlayChoice>(
			(dismiss) => <PromptDangerModal {...options} dismiss={dismiss} />,
			dangerOverlay,
		);
	}, [present]);
}

export function useNestedPromptDangerModal() {
	return usePromiseModal<PromptDangerOptions, OverlayChoice>(
		PromptDangerModal,
		dangerOverlay,
	);
}
