import { IonButton, IonButtons, IonCheckbox, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonItem, IonLabel, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import AmountInput from "@/Components/AmountInput";
import { Satoshi } from "@/lib/types/units";
import { useAmountInput } from "@/Components/AmountInput/useAmountInput";


interface NewInvoiceModalProps {
	dismiss: (data: { amount: Satoshi, invoiceMemo: string, blind: boolean } | null, role?: string) => void;
}

const NewInvoiceModal = forwardRef<HTMLIonInputElement, NewInvoiceModalProps>(({ dismiss }: NewInvoiceModalProps, inputRef) => {
	const amountInputRef = useRef<HTMLIonInputElement>(null);

	useImperativeHandle(inputRef, () => amountInputRef.current as HTMLIonInputElement);

	const amountInput = useAmountInput({});
	const [invoiceMemo, setInvoiceMemo] = useState("");
	const [blind, setBlind] = useState(false);


	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (amountInput.effectiveSats !== null) {
			dismiss({ amount: amountInput.effectiveSats, invoiceMemo, blind }, "confirm");
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
							disabled={!amountInput.effectiveSats}
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
									unit={amountInput.unit}
									displayValue={amountInput.displayValue}
									limits={amountInput.limits}
									isDisabled={amountInput.inputDisabled}
									effectiveSats={amountInput.effectiveSats}
									error={amountInput.error}
									onType={amountInput.typeAmount}
									onPressMax={amountInput.pressMax}
									onToggleUnit={amountInput.toggleUnit}
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
					{/* Hidden submit button for Enter key support */}
					<input type="submit" hidden />
				</form>
			</IonContent>
		</>
	);
});

NewInvoiceModal.displayName = "NewInvoiceModal";
export default NewInvoiceModal;
