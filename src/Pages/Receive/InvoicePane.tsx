import {
	forwardRef,
	useImperativeHandle,
	useRef,
	useState,
	type FormEvent,
} from "react";
import {
	IonButton,
	IonInput,
	IonSpinner,
	IonToggle,
} from "@ionic/react";
import cn from "clsx";
import { AmountField, type AmountFieldChange } from "@/Components/AmountField";
import { FiatDisplay } from "@/Components/FiatDisplay";
import { useToast } from "@/lib/contexts/useToast";
import type { ParsedInvoiceInput } from "@/lib/types/parse";
import type { Satoshi } from "@/lib/types/units";
import { formatSatoshi } from "@/lib/units";
import type { SourceView } from "@/State/scoped/backups/sources/selectors";
import { ExpandablePayload } from "./ExpandablePayload";
import { createInvoiceForSource } from "./helpers";
import { ReceiveQr } from "./ReceiveQr";

const HEAD = 12;
const TAIL = 12;

const EMPTY_AMOUNT: AmountFieldChange = { sats: null, error: undefined };

export type InvoicePaneHandle = {
	focusAmount: () => void;
};

export const InvoicePane = forwardRef<InvoicePaneHandle, { source: SourceView }>(
	function InvoicePane({ source }, ref) {
	const { showToast } = useToast();
	const [invoice, setInvoice] = useState<ParsedInvoiceInput | null>(null);
	const [replacing, setReplacing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [amountChange, setAmountChange] = useState<AmountFieldChange>(EMPTY_AMOUNT);
	const [invoiceMemo, setInvoiceMemo] = useState("");
	const [blind, setBlind] = useState(false);
	const amountRef = useRef<HTMLIonInputElement>(null);
	const formVisible = !invoice || replacing;

	useImperativeHandle(ref, () => ({
		focusAmount: () => {
			if (!formVisible) return;
			void amountRef.current?.setFocus();
		},
	}), [formVisible]);

	const createInvoice = async (amount: Satoshi, memo: string, blindPath: boolean) => {
		setLoading(true);
		try {
			const created = await createInvoiceForSource(source, amount, memo, blindPath);
			setInvoice(created);
			setReplacing(false);
			setAmountChange(EMPTY_AMOUNT);
			setInvoiceMemo("");
			setBlind(false);
		} catch (err: unknown) {
			showToast({
				message: err instanceof Error ? err.message : "Failed to create invoice",
				color: "danger",
			});
		} finally {
			setLoading(false);
		}
	};

	const submitInvoice = (event: FormEvent) => {
		event.preventDefault();
		if (amountChange.sats === null || loading) return;
		void createInvoice(amountChange.sats, invoiceMemo, blind);
	};

	const canSubmit = amountChange.sats !== null && !loading;

	return (
		<div className="mx-auto flex h-full w-full max-w-md flex-col">
			{
				(!invoice || replacing) ? (
					<form className="flex min-h-0 flex-1 flex-col" onSubmit={submitInvoice}>
						<div className="flex min-h-0 flex-1 flex-col px-2 pt-3">
							<AmountField
								ref={amountRef}
								label="Amount"
								labelPlacement="stacked"
								fill="solid"
								mode="md"
								className="filled-input min-h-14"
								placeholder="Enter amount"
								onChange={setAmountChange}
							/>
							<IonInput
								type="text"
								maxlength={90}
								counter
								color="primary"
								id="invoice-memo"
								label="Description (optional)"
								labelPlacement="stacked"
								fill="solid"
								mode="md"
								className="mt-4 filled-input min-h-14"
								disabled={loading}
								onIonInput={(e) =>
									setInvoiceMemo(e.target.value as string)
								}
								placeholder="Description (optional)"
								value={invoiceMemo}
							/>
							<div className="mt-4 flex flex-col gap-1">
								<div className="flex items-center justify-between gap-3">
									<span className="text-sm font-medium text-primary">
										Blinded path
									</span>
									<IonToggle
										checked={blind}
										disabled={loading}
										aria-label="Blinded path"
										aria-describedby="invoice-blind-desc"
										className="m-0 min-h-0"
										onIonChange={(e) => setBlind(e.detail.checked)}
									/>
								</div>
								<p
									id="invoice-blind-desc"
									className="m-0 text-sm leading-snug text-muted"
								>
									Hides your node from the payer. Hard to scan as a QR code.
								</p>
							</div>

							<div className={cn("mt-auto shrink-0 pt-10", invoice && "flex gap-3")}>
								{invoice ? (
									<IonButton
										type="button"
										fill="clear"
										expand="block"
										className="m-0 flex-1 [--color:var(--app-text-primary)]"
										disabled={loading}
										onClick={() => setReplacing(false)}
									>
										Cancel
									</IonButton>
								) : null}
								<IonButton
									type="submit"
									expand="block"
									size="large"
									className="[--border-radius:12px]"
									disabled={!canSubmit}
								>
									{loading ? (
										<IonSpinner name="crescent" className="h-5 w-5" />
									) : (
										"Generate invoice"
									)}
								</IonButton>
							</div>
						</div>
					</form>
				) : (
					<>
						<div className="flex flex-col items-center justify-center gap-3">
							<ReceiveQr value={invoice.data} prefix="lightning" />
							<ExpandablePayload value={invoice.data} head={HEAD} tail={TAIL} />
							<div className="flex flex-col items-center justify-center">
								<p className="text-lg font-semibold text-[--ion-color-primary]">{formatSatoshi(invoice.amount)} sats</p>
								<FiatDisplay sats={invoice.amount} />
							</div>

						</div>
						<IonButton
							expand="block"
							size="large"
							color="primary"
							className="mt-auto [--border-radius:12px]"
							onClick={() => setReplacing(true)}
						>
							Generate New Invoice
						</IonButton>
					</>
				)
			}
		</div>
	);
	},
);
