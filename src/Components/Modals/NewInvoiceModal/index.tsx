import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import {
	IonButton,
	IonButtons,
	IonCheckbox,
	IonCol,
	IonContent,
	IonGrid,
	IonHeader,
	IonInput,
	IonItem,
	IonLabel,
	IonRow,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import {
	AmountField,
	type AmountFieldChange,
} from "@/Components/AmountField";
import type { Satoshi } from "@/lib/types/units";
import { useOverlayCoordinator, type Dismiss, type OverlayChoice } from "@/overlay";

export type NewInvoiceResult = {
	amount: Satoshi;
	invoiceMemo: string;
	blind: boolean;
};

type NewInvoiceModalProps = {
	dismiss: Dismiss<OverlayChoice<NewInvoiceResult>>;
};

const NewInvoiceModal = forwardRef<HTMLIonInputElement, NewInvoiceModalProps>(function NewInvoiceModal({ dismiss }, inputRef) {
	const amountRef = useRef<HTMLIonInputElement>(null);
	useImperativeHandle(inputRef, () => amountRef.current as HTMLIonInputElement);

	const [amountChange, setAmountChange] = useState<AmountFieldChange>({
		sats: null,
		error: undefined,
	});
	const [invoiceMemo, setInvoiceMemo] = useState("");
	const [blind, setBlind] = useState(false);

	const confirm = () => {
		if (amountChange.sats === null) return;
		dismiss({
			role: "confirm",
			data: {
				amount: amountChange.sats,
				invoiceMemo,
				blind,
			},
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		confirm();
	};

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={() => dismiss({ role: "cancel" })}>
							Cancel
						</IonButton>
					</IonButtons>
					<IonTitle>New Invoice</IonTitle>
					<IonButtons slot="end">
						<IonButton
							type="submit"
							disabled={amountChange.sats === null}
							color="primary"
							onClick={confirm}
							strong
						>
							Confirm
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<form onSubmit={handleSubmit}>
					<IonGrid className="ion-margin-top">
						<IonRow>
							<IonCol>
								<AmountField
									ref={amountRef}
									labelPlacement="floating"
									onChange={setAmountChange}
								/>
							</IonCol>
						</IonRow>
						<IonRow>
							<IonCol>
								<IonInput
									type="text"
									maxlength={90}
									counter
									color="primary"
									style={{ marginTop: "15px" }}
									id="invoice-memo"
									label="Description (optional)"
									labelPlacement="floating"
									onIonInput={(e) => setInvoiceMemo(e.target.value as string)}
									placeholder="Description (optional)"
									value={invoiceMemo}
								></IonInput>
							</IonCol>
						</IonRow>
						<IonRow>
							<IonCol>
								<IonItem>
									<IonCheckbox
										checked={blind}
										onIonChange={(e) => setBlind(e.detail.checked)}
									/>
									<IonLabel style={{ marginLeft: "15px" }}>
										Blinded Path
									</IonLabel>
								</IonItem>
							</IonCol>
						</IonRow>
					</IonGrid>
					<input type="submit" hidden />
				</form>
			</IonContent>
		</>
	);
},
);

export function useNewInvoiceModal() {
	const { present } = useOverlayCoordinator();
	const amountInputRef = useRef<HTMLIonInputElement>(null);
	return useCallback(() => {
		return present<OverlayChoice<NewInvoiceResult>>(
			(dismiss) => <NewInvoiceModal dismiss={dismiss} ref={amountInputRef} />,
			{
				cssClass: "wallet-modal",
				onDidPresent: () => {
					void amountInputRef.current?.setFocus();
				},
			},
		);
	}, [present]);
}
