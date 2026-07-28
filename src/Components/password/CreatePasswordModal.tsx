import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonInput,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import type { ModalDismiss } from "../Modals/hooks/useAskModal";
import { useAskModal } from "../Modals/hooks/useAskModal";
import { closeOutline } from "ionicons/icons";
import { FormEvent, useCallback, useEffect, useId, useState } from "react";

export type CreatePasswordModalOptions = {
	description?: string;
	username?: string;
	cancelButtonLabel?: string;
	minLength?: number;
};

type CreatePasswordModalProps = CreatePasswordModalOptions & {
	dismiss: ModalDismiss<string>;
};

export function CreatePasswordModal({
	description = "Create a password to secure your private key",
	username,
	cancelButtonLabel = "Cancel",
	minLength = 8,
	dismiss,
}: CreatePasswordModalProps) {

	const id = useId();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [isTouched, setIsTouched] = useState(false);
	const [isError, setIsError] = useState<string | null>(null);

	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		setIsError(null);
		const error = validatePassword(password, confirmPassword, minLength);
		if (error) {
			setIsError(error);
		}
	}, [password, confirmPassword, minLength])









	const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (
			password.length < minLength ||
			password !== confirmPassword
		) {
			return;
		}

		setSubmitting(true);

		try {
			dismiss(password, "confirm");
		} finally {
			setSubmitting(false);
		}

	}, [password, confirmPassword, minLength, dismiss,]);

	const isSubmitDisabled =
		!password ||
		submitting ||
		!!isError

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>
						<div className="text-secondary">
							Create Password
						</div>
					</IonTitle>
					<IonButtons slot="end">

						<IonButton onClick={() => dismiss(null, "cancel")}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<form
					id={id}
					onSubmit={handleSubmit}
					className="flex flex-col gap-4 mt-9"
				>
					<IonText className="text-secondary leading-normal text-wrap pb-4">{description}</IonText>
					{
						username && (
							<input
								type="text"
								name="username"
								autoComplete="username"
								value={username}
								readOnly
								className="absolute left-[10000px] h-px w-px overflow-hidden"
							/>
						)
					}
					<IonInput
						className={`${!isError && 'ion-valid'} ${isError && 'ion-invalid'} ${isTouched && 'ion-touched'}`}
						label="Password"
						labelPlacement="stacked"
						fill="outline"
						color="primary"
						mode="md"
						type="password"
						autocomplete="new-password"
						name="new-password"
						value={password}
						onIonInput={(e) => setPassword(e.detail.value ?? "")}
						minlength={minLength}
						required
					/>

					<IonInput
						className={`${!isError && 'ion-valid'} ${isError && 'ion-invalid'} ${isTouched && 'ion-touched'}`}
						name="confirm-password"
						type="password"
						autocomplete="new-password"
						value={confirmPassword}
						label="Confirm password"
						labelPlacement="stacked"
						fill="outline"
						color="primary"
						mode="md"
						errorText={isError ?? undefined}
						minlength={minLength}
						required
						onIonInput={(e) => setConfirmPassword(e.detail.value ?? "")}
						onIonBlur={() => setIsTouched(true)}
					/>
				</form>
			</IonContent>
			<IonFooter>
				<IonToolbar className="ion-border">
					<div className="px-5 flex justify-end items-center gap-3">
						<IonButton expand="block" fill="solid" color="dark" onClick={() => dismiss(null, "cancel")}>{cancelButtonLabel}</IonButton>
						<IonButton expand="block" fill="solid" form={id} type="submit" color="primary" disabled={isSubmitDisabled}>Set Password</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>

		</>
	);
}

const validatePassword = (password: string, confirmPassword: string, minLength: number) => {
	if (password.length < minLength) {
		return `Password must be at least ${minLength} characters.`;
	}
	if (password !== confirmPassword) {
		return "Passwords do not match.";
	}
	return null;
}

export function useAskCreatePassword() {
	return useAskModal<CreatePasswordModalOptions, string>(CreatePasswordModal, "wallet-modal");
}


