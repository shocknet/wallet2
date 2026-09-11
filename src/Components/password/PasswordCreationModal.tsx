import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
} from "@ionic/react";
import { useCallback, useId } from "react";
import { CreatePasswordForm } from "./CreatePasswordForm";
import {
	useOverlayCoordinator,
	type Dismiss,
	type OverlayChoice,
	type OverlayOptions,
} from "@/overlay";

type PasswordCreationModalProps = {
	description?: string;
	username?: string;
	cancelButtonLabel?: string;
	dismiss: Dismiss<OverlayChoice<string>>;
};

function PasswordCreationModal({
	description,
	username,
	cancelButtonLabel,
	dismiss,
}: PasswordCreationModalProps) {
	const id = useId();
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle className="text-primary text-lg font-bold">
						Create Password
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<div className="ion-padding bg-[var(--app-surface)]">
				<CreatePasswordForm
					id={id}
					description={description}
					username={username}
					onSubmit={(password) => dismiss({ role: "confirm", data: password })}
					ionInputProps={{
						fill: "solid",
						className: "filled-input min-h-[2.5rem]",
					}}
				/>

				<div className="w-full flex justify-end gap-3 mt-5">
					{cancelButtonLabel ? (
						<IonButton
							color="dark"
							fill="solid"
							onClick={() => dismiss({ role: "cancel" })}
						>
							{cancelButtonLabel}
						</IonButton>
					) : null}
					<IonButton
						type="submit"
						form={id}
						color="primary"
						expand="block"
						fill="solid"
					>
						Confirm
					</IonButton>
				</div>
			</div>
		</>
	);
}

const lockedPasswordOverlay: OverlayOptions = {
	cssClass: "dialog-modal wallet-modal",
	backdropDismiss: false,
	keyboardClose: false,
	canDismiss: (_data, role) => Promise.resolve(role === "confirm" || role === "cancel"),
};

export function usePasswordCreationModal(
	username?: string,
	description?: string,
	cancelButtonLabel?: string,
) {
	const { present } = useOverlayCoordinator();
	return useCallback(() => {
		return present<OverlayChoice<string>>(
			(dismiss) => (
				<PasswordCreationModal
					username={username}
					description={description}
					cancelButtonLabel={cancelButtonLabel}
					dismiss={dismiss}
				/>
			),
			lockedPasswordOverlay,
		);
	}, [present, username, description, cancelButtonLabel]);
}
