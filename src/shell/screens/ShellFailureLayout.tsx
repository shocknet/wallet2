import {
	IonButton,
	IonContent,
	IonIcon,
	IonPage,
	IonSpinner,
} from "@ionic/react";
import { warningOutline } from "ionicons/icons";
import type { ReactNode } from "react";

export type ShellFailureAction = {
	key: string;
	label: string;
	busyLabel?: string;
	primary?: boolean;
	disabled?: boolean;
	busy?: boolean;
	onClick: () => void;
};

export function ShellFailureLayout({
	title,
	message,
	detail,
	meta,
	actions,
}: {
	title: string;
	message: string;
	detail?: string;
	meta?: ReactNode;
	actions: ShellFailureAction[];
}) {
	return (
		<IonPage className="ion-page-width">
			<IonContent className="ion-padding ion-content-only">
				<div
					className="
						min-h-full
						flex flex-col items-center justify-center
						w-full max-w-md
						mx-auto px-1
					"
				>
					<header className="w-full text-center">
						<div
							className="
								mx-auto mb-4 flex size-11 items-center
								justify-center rounded-2xl
								bg-[color-mix(in_srgb,var(--ion-color-warning)_14%,transparent)]
								text-[var(--ion-color-warning)]
							"
						>
							<IonIcon
								icon={warningOutline}
								className="text-xl"
							/>
						</div>

						<h1 className="text-2xl font-semibold tracking-tight text-primary">
							{title}
						</h1>

						<p className="mt-3 text-sm leading-6 text-muted">
							{message}
						</p>

						{detail ? (
							<p className="mt-3 text-sm leading-6 text-secondary">
								{detail}
							</p>
						) : null}

						{meta ? <div className="mt-4">{meta}</div> : null}
					</header>

					<div className="mt-10 w-full flex flex-col gap-2">
						{actions.map((action) => (
							<IonButton
								key={action.key}
								expand="block"
								size="large"
								fill={action.primary ? "solid" : "outline"}
								color={action.primary ? "primary" : "medium"}
								className="[--border-radius:12px]"
								disabled={action.disabled}
								onClick={action.onClick}
							>
								{action.busy ? (
									<>
										<IonSpinner
											name="crescent"
											className="mr-2 h-4 w-4"
										/>
										{action.busyLabel ?? "Working…"}
									</>
								) : (
									action.label
								)}
							</IonButton>
						))}
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
}
