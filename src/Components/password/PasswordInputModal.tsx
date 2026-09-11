import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonButtons,
	IonIcon,
} from "@ionic/react";
import { InputPasswordform } from "./InputPasswordForm";
import { useCallback, useId } from "react";
import { closeOutline } from "ionicons/icons";
import {
	allowOverlayRoles,
	useOverlayCoordinator,
	type Dismiss,
	type OverlayChoice,
	type OverlayOptions,
} from "@/overlay";

type PasswordInputModalProps = {
	description?: string;
	submitButtonLabel?: string;
	username?: string;
	dismiss: Dismiss<OverlayChoice<string>>;
};

function PasswordInputModal({ description, submitButtonLabel, username, dismiss }: PasswordInputModalProps) {
	const id = useId();
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle className="text-primary text-lg font-bold">Input Password</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss({ role: "cancel" })}><IonIcon slot="icon-only" icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<div className="ion-padding bg-[var(--app-surface)]">
				<InputPasswordform
					id={id}
					description={description}
					username={username}
					onSubmit={(password) => dismiss({ role: "confirm", data: password })}
					ionInputProps={{
						fill: "solid",
						className: "filled-input min-h-[2.5rem]",
					}}
				/>

				<div className="w-full flex justify-end mt-5">
					<IonButton
						type="submit"
						form={id}
						color="primary"
						expand="block"
						fill="solid"
					>
						{submitButtonLabel || "Submit"}
					</IonButton>
				</div>
			</div>
		</>
	)
}

const lockedPasswordOverlay: OverlayOptions = {
	cssClass: "dialog-modal wallet-modal",
	backdropDismiss: false,
	keyboardClose: false,
	canDismiss: allowOverlayRoles("confirm", "cancel"),
};

export function usePasswordInputModal(username?: string, description?: string) {
	const { present } = useOverlayCoordinator();
	return useCallback(() => {
		return present<OverlayChoice<string>>(
			(dismiss) => (
				<PasswordInputModal
					username={username}
					description={description}
					dismiss={dismiss}
				/>
			),
			lockedPasswordOverlay,
		);
	}, [present, username, description]);
}
