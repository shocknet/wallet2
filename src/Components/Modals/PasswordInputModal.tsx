import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonButtons,
	IonIcon,
} from "@ionic/react";
import { InputPasswordform } from "../password/InputPasswordForm";
import { useId } from "react";
import { closeOutline } from "ionicons/icons";

interface PasswordInputModalProps {
	description?: string;
	submitButtonLabel?: string;

	username?: string;
	dismiss: (data?: string | null | undefined | number, role?: string) => void
}

export function PasswordInputModal({ description, submitButtonLabel, username, dismiss }: PasswordInputModalProps) {
	const id = useId();
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle className="text-primary text-lg font-bold">Input Password</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss(undefined, "cancel")}><IonIcon slot="icon-only" icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<div className="ion-padding bg-[var(--app-surface)]">



				<InputPasswordform
					id={id}
					description={description}
					username={username}
					onSubmit={(password) => dismiss(password, "confirm")}
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
