import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	IonButton,
	IonContent,
	IonHeader,
	IonPage,
	useIonLoading,
	useIonRouter,
} from "@ionic/react";
import { useHistory } from "react-router";
import {
	AmountField,
	type AmountFieldChange,
} from "@/Components/AmountField";
import { BitcoinInput, type BitcoinInputHandle } from "@/Components/BitcoinInput/BitcoinInput";
import { IDLE_STATE, type BitcoinInputState } from "@/Components/BitcoinInput/model";
import { SourceSelectionView } from "@/Components/Source/SourceSelectionView";
import { SourceReachabilityHint } from "@/Components/Source/SourceReachabilityHint";
import { useSourceSelectModal } from "@/Components/Source/SourceSelectSheet";
import RootPageToolbar from "@/Layout2/RootPageToolbar";
import { ParseStatusHint } from "./ParseStatusHint";
import { useToast } from "@/lib/contexts/useToast";
import { NofferRangeError } from "@/lib/noffer";
import type { Satoshi } from "@/lib/types/units";
import { satoshi } from "@/lib/units";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import { resolveRecipientToInvoice } from "@/State/scoped/backups/sources/history/resolveToInvoice";
import {
	invoiceSourceFromParsed,
	sendInvoicePayment,
} from "@/State/scoped/backups/sources/history/sendInvoicePayment";
import {
	selectSourceViews,
} from "@/State/scoped/backups/sources/selectors";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { getAmountFieldIntent } from "./amountFieldIntent";
import {
	pickDefaultSource,
	pickSourceCoveringAmount,
	SEND_DISALLOWED_CLASSIFICATIONS,
	validateSendRecipient,
} from "./helpers";
import { useConfirmSendModal } from "./ConfirmSendModal";
import { RecipientInfoCard } from "./RecipientInfoCard";
import { RecipientTypesHint } from "./RecipientTypesHint";
import { FeeReserveHint } from "./FeeReserveHint";
import type { AmountRange } from "./types";
import { isSendParsedInput, type SendPageNavState } from "./nav";
import type { ParsedInvoiceInput } from "@/lib/types/parse";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";

export default function Send() {
	const { location } = useHistory();
	const visitKeyRef = useRef(location.key);
	if (location.pathname === "/send") {
		visitKeyRef.current = location.key;
	}

	return (
		<IonPage className="ion-page-width">
			<SendInner key={visitKeyRef.current} />
		</IonPage>
	);
}

function SendInner() {
	const sources = useAppSelector(selectSourceViews);
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const { showToast } = useToast();
	const router = useIonRouter();
	const history = useHistory<SendPageNavState>();
	const dispatch = useAppDispatch();
	const sourceSelect = useSourceSelectModal();
	const recipientRef = useRef<BitcoinInputHandle>(null);
	const amountRef = useRef<HTMLIonInputElement>(null);
	const reviewing = useRef(false);
	const [presentLoading, dismissLoading] = useIonLoading();
	const askConfirmSend = useConfirmSendModal();

	const [selectedSourceId, setSelectedSourceId] = useState(
		() => pickDefaultSource(sources, favoriteSourceId).sourceId,
	);
	const [recipient, setRecipient] = useState<BitcoinInputState>(IDLE_STATE);
	const [nofferRange, setNofferRange] = useState<AmountRange | null>(null);
	const [amountChange, setAmountChange] = useState<AmountFieldChange>({
		sats: null,
		error: undefined,
	});
	const [amountFieldKey, setAmountFieldKey] = useState(0);

	useEffect(() => {
		if (!sources.some((s) => s.sourceId === selectedSourceId)) {
			setSelectedSourceId(
				pickDefaultSource(sources, favoriteSourceId).sourceId,
			);
		}
	}, [sources, selectedSourceId, favoriteSourceId]);

	const source = useMemo(() => {
		return sources.find((s) => s.sourceId === selectedSourceId) ??
			pickDefaultSource(sources, favoriteSourceId);
	}, [sources, selectedSourceId, favoriteSourceId]);

	useEffect(() => {
		const location = history.location;
		if (location.pathname !== "/send") return;
		const parsed = location.state?.parsed;
		if (!parsed) return;

		recipientRef.current?.commit(parsed);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [history.location.key]);

	const parsed =
		recipient.status === "ok" && isSendParsedInput(recipient.parsed)
			? recipient.parsed
			: null;
	const parsedIdentity = parsed?.data ?? null;

	useEffect(() => {
		setNofferRange(null);
	}, [parsedIdentity]);

	const amountFieldIntent = useMemo(
		() =>
			getAmountFieldIntent(
				parsed,
				source.maxWithdrawableSats,
				nofferRange,
			),
		[parsed, source.maxWithdrawableSats, nofferRange],
	);

	useEffect(() => {
		if (!amountFieldIntent.focusAmount || !parsedIdentity) return;
		void amountRef.current?.setFocus();
	}, [amountFieldIntent.focusAmount, parsedIdentity]);

	const switchToSourceCoveringAmount = useCallback(
		(amount: Satoshi) => {
			const better = pickSourceCoveringAmount(
				sources,
				amount,
				favoriteSourceId,
			);
			if (better && better.sourceId !== selectedSourceId) {
				setSelectedSourceId(better.sourceId);
				showToast({
					header: "Source switched",
					message: `${sourceDisplayName(better)} can cover this amount.`,
					color: "warning",
					duration: 2000,
				});
			}
		},
		[sources, selectedSourceId, favoriteSourceId, showToast],
	);

	useEffect(() => {
		const fixed = amountFieldIntent.fixedSats;
		if (fixed == null) return;
		if (source.maxWithdrawableSats >= fixed) return;
		switchToSourceCoveringAmount(fixed);
	}, [
		amountFieldIntent.fixedSats,
		source.maxWithdrawableSats,
		switchToSourceCoveringAmount,
	]);

	const canPay =
		parsed !== null &&
		amountChange.sats != null &&
		source.maxWithdrawableSats >= amountChange.sats;

	const handleReviewPayment = async () => {
		if (reviewing.current) return;
		if (parsed === null || amountChange.sats == null) return;

		reviewing.current = true;
		const amount = amountChange.sats;
		const sourceId = source.sourceId;

		try {
			let invoice: ParsedInvoiceInput;
			try {
				await presentLoading({
					message: "Preparing payment…",
					backdropDismiss: false,
					cssClass: "app-loading",
				});
				invoice = await resolveRecipientToInvoice({
					parsed,
					amount,
					keys: source.keys,
				});
			} catch (err: unknown) {
				if (err instanceof NofferRangeError) {
					setNofferRange({
						min: satoshi(err.range.min),
						max: satoshi(err.range.max),
					});
					setAmountChange({ sats: null, error: undefined });
					setAmountFieldKey((k) => k + 1);
					showToast({
						header: "Amount out of range",
						message: "Limits updated — try again.",
						color: "warning",
					});
				} else {
					showToast({
						header: "Invoice generation failed",
						message: err instanceof Error ? err.message : "Could not generate an invoice",
						color: "danger",
					});
				}
				return;
			} finally {
				await dismissLoading();
			}

			const confirmed = await askConfirmSend({
				amount,
				parsed,
				source,
				initialNote: invoice.memo,
			});
			if (confirmed.role !== "confirm") return;

			try {
				dispatch(sendInvoicePayment({
					sourceId,
					parsedInvoice: invoice,
					amount,
					note: confirmed.data.note,
					invoiceSource: invoiceSourceFromParsed(parsed),
					showToast,
				}));
			} catch (err: unknown) {
				showToast({
					header: "Payment failed",
					message: err instanceof Error ? err.message : "Could not send payment",
					color: "danger",
				});
				return;
			}

			router.goBack();
		} finally {
			reviewing.current = false;
		}
	};

	return (
		<>
			<IonHeader className="ion-no-border">
				<RootPageToolbar title="Pay" />
			</IonHeader>
			<IonContent className="ion-padding ion-content-no-footer">
				<div className="mx-auto flex h-full min-h-full w-full max-w-md flex-col gap-6 pb-8 pt-2">
					<div className="flex flex-col gap-2">
						<SourceSelectionView
							showTapToSwitch={false}
							showBalance
							source={source}
							onClick={() => {
								sourceSelect({
									sources,
									selectedSourceId,
									title: "Spend from",
								}).then((result) => {
									if (result.role === "confirm") setSelectedSourceId(result.data.sourceId);
								});
							}}
						/>
						<FeeReserveHint
							sourceId={source.sourceId}
							balanceSats={source.balanceSats}
							availableSats={source.maxWithdrawableSats}
							reserveSats={satoshi(
								Math.max(
									0,
									source.balanceSats -
									source.maxWithdrawableSats,
								),
							)}
						/>
						<SourceReachabilityHint source={source} />
					</div>

					<div className="flex min-h-0 flex-1 flex-col">
						<div className="flex flex-col gap-4">
							<AmountField
								key={amountFieldKey}
								ref={amountRef}
								className="filled-input min-h-14"
								fill="solid"
								mode="md"
								labelPlacement="stacked"
								limits={amountFieldIntent.limits}
								fixedSats={amountFieldIntent.fixedSats}
								onChange={setAmountChange}
							/>

							<div className="flex flex-col gap-2">
								<BitcoinInput
									ref={recipientRef}
									className="filled-input min-h-14"
									label="Recipient"
									labelPlacement="stacked"
									fill="solid"
									mode="md"
									color="primary"
									placeholder="Paste invoice, Noffer, LNURL, or Lightning address"
									unidentifiedError="Unidentified recipient"
									scanInstruction="Scan a Lightning Invoice, Noffer string, Lnurl, or Lightning Address"
									disallowed={[...SEND_DISALLOWED_CLASSIFICATIONS]}
									validate={validateSendRecipient}
									onChange={setRecipient}
								/>
								<ParseStatusHint state={recipient} />
								<div className="mt-4">
									{parsed ? (
										<RecipientInfoCard
											parsed={parsed}
											nofferRange={nofferRange}
										/>
									) : (
										<RecipientTypesHint />
									)}
								</div>
							</div>
						</div>

						<div className="mt-auto flex gap-3 pt-6">
							<IonButton
								fill="clear"
								expand="block"
								className="m-0 flex-1 [--border-radius:12px] [--color:var(--app-text-primary)]"
								onClick={() => router.goBack()}
							>
								Cancel
							</IonButton>
							<IonButton
								color="primary"
								fill="solid"
								expand="block"
								className="m-0 flex-1 [--border-radius:12px]"
								disabled={!canPay}
								onClick={() => void handleReviewPayment()}
							>
								Review payment
							</IonButton>
						</div>
					</div>
				</div>
			</IonContent>
		</>
	);
}
