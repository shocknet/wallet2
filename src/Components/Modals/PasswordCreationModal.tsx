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
	/** When set, shows a labeled cancel/skip action (e.g. "Skip") next to Confirm. */
	cancelButtonLabel?: string;
	dismiss: (data?: string | null | undefined | number, role?: string) => void;
}

export function PasswordCreationModal({
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
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss(undefined, "cancel")}>
							<IonIcon slot="icon-only" icon={closeOutline} />
						</IonButton>
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

				<div className="w-full flex justify-end gap-3 mt-5">
					{cancelButtonLabel ? (
						<IonButton
							color="dark"
							fill="solid"
							onClick={() => dismiss(undefined, "cancel")}
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
