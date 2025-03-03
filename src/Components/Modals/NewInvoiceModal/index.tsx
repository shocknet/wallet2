import { IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { sanitizeSatsInput } from "../../../utils/numbers";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

interface NewInvoiceModalProps {
	dismiss: (data: { amount: string, invoiceMemo: string } | null, role?: string) => void;
}

const NewInvoiceModal = forwardRef<HTMLIonInputElement, any>(({ dismiss }: NewInvoiceModalProps, inputRef) => {
	const input = useRef<HTMLIonInputElement>(null);
	const [amount, setAmount] = useState("");
	const [invoiceMemo, setInvoiceMemo] = useState("");

	useImperativeHandle(inputRef, () => input.current as HTMLIonInputElement);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (amount) {
			dismiss({ amount, invoiceMemo }, "confirm");
		}
	};

	const onInput = (event: Event) => {
		const value = (event.target as HTMLIonInputElement).value as string;
		const formattedSats = sanitizeSatsInput(value);
		setAmount(formattedSats);
		const inputCmp = input.current;
		if (inputCmp !== null) {
			inputCmp.value = formattedSats;
		}
	};

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={() => dismiss(null, "cancel")}>
							Cancel
						</IonButton>
					</IonButtons>
					<IonTitle size="large">New Invoice</IonTitle>
					<IonButtons slot="end">
						<IonButton
							type="submit"
							disabled={!amount}
							color="primary"
							strong
							onClick={() => dismiss({ amount, invoiceMemo }, "confirm")}
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
								<IonInput
									ref={input}
									className="wallet-input"
									fill="outline"
									inputMode="numeric"
									type="text"
									onIonInput={onInput}
									placeholder="Enter amount in sats"
									value={amount}
								>
									<div slot="end" style={{ paddingLeft: '8px', color: '#666' }}>
										sats
									</div>
								</IonInput>
							</IonCol>
						</IonRow>
						<IonRow>
							<IonCol>
								<IonInput
									className="wallet-input"
									fill="outline"
									type="text"
									maxlength={90}
									counter
									style={{ marginTop: "15px" }}
									id="invoice-memo"
									onIonInput={(e) => setInvoiceMemo(e.target.value as string)}
									placeholder="Description (optional)"
									value={invoiceMemo}
								/>
							</IonCol>
						</IonRow>
					</IonGrid>
					{/* Hidden submit button for Enter key support */}
					<input type="submit" hidden />
				</form>
			</IonContent>
		</>
	);
});

NewInvoiceModal.displayName = "NewInvoiceModal";
export default NewInvoiceModal;