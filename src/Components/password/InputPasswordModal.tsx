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

export type InputPasswordModalOptions = {
	title: string;
	description: string;
	username?: string;
};

type InputPasswordModalProps = InputPasswordModalOptions & {
	dismiss: ModalDismiss<string>;
};

export function InputPasswordModal({
	title,
	description,
	username,
	dismiss,
}: InputPasswordModalProps) {
	const id = useId();

	const [password, setPassword] = useState("");
	const [isTouched, setIsTouched] = useState(false);
	const [isError, setIsError] = useState<string | null>(null);

	useEffect(() => {
		setIsError(null);
		if (password.length < 8) {
			setIsError("Password must be at least 8 characters.");
		}
	}, [password])

	const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!password) return;


		dismiss(password, "confirm");


	}, [password, dismiss]);

	const isSubmitDisabled =
		!password ||
		!!isError

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>
						<div className="text-secondary">
							{title}
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
								className="absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
							/>
						)
					}
					<IonInput
						className={`${!isError && 'ion-valid'} ${isError && 'ion-invalid'} ${isTouched && 'ion-touched'}`}
						label="Password"
						labelPlacement="stacked"
						fill="outline"
						mode="md"
						type="password"
						autocomplete="current-password"
						name="password"
						value={password}
						onIonInput={(e) => setPassword(e.detail.value ?? "")}
						required
						errorText={isError ?? undefined}
						onIonBlur={() => setIsTouched(true)}
					/>
				</form>
			</IonContent>
			<IonFooter>
				<IonToolbar className="ion-border">
					<div className="px-5 flex justify-end items-center gap-3">
						<IonButton expand="block" fill="solid" color="dark" onClick={() => dismiss(null, "cancel")}>Cancel</IonButton>
						<IonButton expand="block" fill="solid" form={id} type="submit" color="primary" disabled={isSubmitDisabled}>Confirm</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>
		</>
	);
}

export function useAskPassword() {
	return useAskModal<InputPasswordModalOptions, string>(InputPasswordModal, "wallet-modal");
}
