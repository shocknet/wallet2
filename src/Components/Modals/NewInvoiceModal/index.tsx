import { IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import AmountInput from "@/Components/AmountInput";
import { Satoshi } from "@/lib/types/units";


interface NewInvoiceModalProps {
	dismiss: (data: { amount: Satoshi, invoiceMemo: string } | null, role?: string) => void;
}

const NewInvoiceModal = forwardRef<HTMLIonInputElement, NewInvoiceModalProps>(({ dismiss }: NewInvoiceModalProps, inputRef) => {
	const amountInputRef = useRef<HTMLIonInputElement>(null);
	const [amountInSats, setAmountInSats] = useState<Satoshi | null>(null);
	const [unit, setUnit] = useState<"BTC" | "sats">("sats");
	const [displayValue, setDisplayValue] = useState("");
	const [invoiceMemo, setInvoiceMemo] = useState("");

	useImperativeHandle(inputRef, () => amountInputRef.current as HTMLIonInputElement);




	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (amountInSats !== null) {
			dismiss({ amount: amountInSats, invoiceMemo }, "confirm");
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
					<IonTitle>New Invoice</IonTitle>
					<IonButtons slot="end">
						<IonButton
							type="submit"
							disabled={!amountInSats}
							color="primary"
							onClick={handleSubmit}
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
								<AmountInput
									ref={amountInputRef}
									labelPlacement="floating"
									amountInSats={amountInSats}
									setAmountInSats={setAmountInSats}
									unit={unit}
									setUnit={setUnit}
									displayValue={displayValue}
									setDisplayValue={setDisplayValue}
								>
								</AmountInput>
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