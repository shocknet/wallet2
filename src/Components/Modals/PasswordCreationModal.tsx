import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonButtons,
	IonIcon,
} from "@ionic/react";
import { useId } from "react";
import { closeOutline } from "ionicons/icons";
import { CreatePasswordForm } from "../password/CreatePasswordForm";

interface PasswordCreationModalProps {
	description?: string;

	username?: string;
	dismiss: (data?: string | null | undefined | number, role?: string) => void
}

export function PasswordCreationModal({ description, username, dismiss }: PasswordCreationModalProps) {
	const id = useId();
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle className="text-primary text-lg font-bold">Create Password</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss(undefined, "cancel")}><IonIcon slot="icon-only" icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<div className="ion-padding bg-[var(--app-surface)]">



				<CreatePasswordForm
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
						Confirm
					</IonButton>
				</div>
			</div>
		</>
	)
}
