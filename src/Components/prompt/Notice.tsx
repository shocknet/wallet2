import { IonButton, IonHeader, IonText, IonTitle, IonToolbar } from "@ionic/react";
import { useCallback } from "react";
import { useOverlayCoordinator, type Dismiss, type OverlayResult } from "@/overlay";
import { lockedPromptOverlay } from "./overlay";

export type PromptNoticeOptions = {
	title: string;
	description?: string;
	buttonLabel?: string;
};

type PromptNoticeProps = PromptNoticeOptions & {
	dismiss: Dismiss<OverlayResult<"confirm">>;
};

function PromptNoticeModal({
	title,
	description,
	buttonLabel = "OK",
	dismiss,
}: PromptNoticeProps) {
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
				<div className="mt-5 flex justify-end">
					<IonButton fill="clear" onClick={() => dismiss({ role: "confirm" })}>
						{buttonLabel}
					</IonButton>
				</div>
			</div>
		</>
	);
}

const noticeOverlay = lockedPromptOverlay();

export function usePromptNoticeModal() {
	const { tryPresent } = useOverlayCoordinator();
	return useCallback((options: PromptNoticeOptions) => {
		return tryPresent<OverlayResult<"confirm">>(
			(dismiss) => <PromptNoticeModal {...options} dismiss={dismiss} />,
			noticeOverlay,
		);
	}, [tryPresent]);
}

