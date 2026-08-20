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
	IonIcon,
	IonInput,
	IonPage,
	useIonLoading,
	useIonRouter,
} from "@ionic/react";
import {
	globeOutline,
	qrCodeOutline,
} from "ionicons/icons";
import { useHistory } from "react-router";
import {
	AmountField,
	type AmountFieldChange,
} from "@/Components/AmountField";
import { SourceSelectionView } from "@/Components/Source/SourceSelectionView";
import { SourceReachabilityHint } from "@/Components/Source/SourceReachabilityHint";
import { SourceSelectSheet } from "@/Components/Source/SourceSelectSheet";
import EmptyState from "@/Components/common/ui/EmptyState";
import { useQrScanner } from "@/Hooks/useQrScanner";
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
	type NprofileView,
	selectNprofileViews,
} from "@/State/scoped/backups/sources/selectors";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import cn from "clsx";
import { getAmountFieldIntent } from "./amountFieldIntent";
import {
	pickDefaultSource,
	pickSourceCoveringAmount,
} from "./helpers";
import { useAskConfirmSend } from "./ConfirmSendModal";
import { RecipientInfoCard } from "./RecipientInfoCard";
import { RecipientTypesHint } from "./RecipientTypesHint";
import { FeeReserveHint } from "./FeeReserveHint";
import { useRecipientField } from "./useRecipientField";
import type { AmountRange } from "./types";
import type { SendPageNavState } from "./nav";
import { navToSources } from "@/Pages/Sources/nav";
import type { ParsedInvoiceInput } from "@/lib/types/parse";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";

export default function Send() {
	const sources = useAppSelector(selectNprofileViews);
	const { location } = useHistory();
	const sendVisitKeyRef = useRef(location.key);
	if (location.pathname === "/send") {
		sendVisitKeyRef.current = location.key;
	}

	return (
		<IonPage className="ion-page-width">
			{sources.length === 0 ? (
				<SendEmpty />
			) : (
				<SendSourceGate key={sendVisitKeyRef.current} sources={sources} />
			)}
		</IonPage>
	);
}

function SendEmpty() {
	const history = useHistory();


	return (
		<>
			<IonHeader className="ion-no-border">
				<RootPageToolbar title="Pay" />
			</IonHeader>
			<IonContent className="ion-padding">
				<EmptyState
					title="No Pub sources"
					description="Add a Pub to send payments from"
					ionicon={globeOutline}
					action={
						<IonButton
							color="primary"
							className="[--border-radius:12px]"
							expand="block"
							onClick={() => navToSources(history, { from: history.location })}
						>
							Go to sources
						</IonButton>
					}
				/>
			</IonContent>
		</>
	);
}

function SendSourceGate({ sources }: { sources: NprofileView[] }) {
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const { showToast } = useToast();
	const [selectedSourceId, setSelectedSourceId] = useState(
		() => pickDefaultSource(sources, favoriteSourceId).sourceId,
	);
	const [sheetOpen, setSheetOpen] = useState(false);

	useEffect(() => {
		if (!sources.some((s) => s.sourceId === selectedSourceId)) {
			setSelectedSourceId(
				pickDefaultSource(sources, favoriteSourceId).sourceId,
			);
		}
	}, [sources, selectedSourceId, favoriteSourceId]);

	const selectedSource = useMemo(() => {
		return sources.find((s) => s.sourceId === selectedSourceId) ??
			pickDefaultSource(sources, favoriteSourceId);
	}, [sources, selectedSourceId, favoriteSourceId]);

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
							source={selectedSource}
							onClick={() => setSheetOpen(true)}
						/>
						<FeeReserveHint
							sourceId={selectedSource.sourceId}
							balanceSats={selectedSource.balanceSats}
							availableSats={selectedSource.maxWithdrawableSats}
							reserveSats={satoshi(
								Math.max(
									0,
									selectedSource.balanceSats -
									selectedSource.maxWithdrawableSats,
								),
							)}
						/>
						<SourceReachabilityHint source={selectedSource} />
					</div>
					<SendStage
						source={selectedSource}
						switchToSourceCoveringAmount={switchToSourceCoveringAmount}
					/>
				</div>

				<SourceSelectSheet
					isOpen={sheetOpen}
					onDidDismiss={() => setSheetOpen(false)}
					selectedSourceId={selectedSourceId}
					onSelect={(source) => setSelectedSourceId(source.sourceId)}
					sources={sources}
					title="Spend from"
				/>
			</IonContent>
		</>
	);
}


function SendStage({
	source,
	switchToSourceCoveringAmount,
}: {
	source: NprofileView;
	switchToSourceCoveringAmount: (amount: Satoshi) => void;
}) {
	const router = useIonRouter();
	const history = useHistory<SendPageNavState>();
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const { scanSingleBarcode } = useQrScanner();

	const { value: recipient, state: recipientState, onInput, commit } = useRecipientField();

	useEffect(() => {
		const location = history.location;
		if (location.pathname !== "/send") return;
		const parsed = location.state?.parsed;
		if (!parsed) return;

		commit(parsed);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [history.location.key, commit]);
	const [nofferRange, setNofferRange] = useState<AmountRange | null>(null);

	const [amountChange, setAmountChange] = useState<AmountFieldChange>({
		sats: null,
		error: undefined,
	});
	const [amountFieldKey, setAmountFieldKey] = useState(0);
	const amountRef = useRef<HTMLIonInputElement>(null);

	const parsedIdentity =
		recipientState.status === "parsedOk" ? recipientState.inputValue : null;

	useEffect(() => {
		setNofferRange(null);
	}, [parsedIdentity]);

	const amountFieldIntent = useMemo(
		() =>
			getAmountFieldIntent(
				recipientState.status === "parsedOk" ? recipientState.parsedData : null,
				source.maxWithdrawableSats,
				nofferRange,
			),
		[recipientState, source.maxWithdrawableSats, nofferRange],
	);



	useEffect(() => {
		if (!amountFieldIntent.focusAmount || !parsedIdentity) return;
		void amountRef.current?.setFocus();
	}, [amountFieldIntent.focusAmount, parsedIdentity]);

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

	const [isTouched, setIsTouched] = useState(false);
	const recipientRef = useRef<HTMLIonInputElement>(null);
	const reviewing = useRef(false);
	const [presentLoading, dismissLoading] = useIonLoading();
	const askConfirmSend = useAskConfirmSend();




	const onRecipientInput = (value: string) => {
		onInput(value);
		if (recipientRef.current) {
			recipientRef.current.classList.remove("ion-invalid");
		}
	};

	const openScan = async () => {
		try {
			const input = await scanSingleBarcode(
				"Scan a Lightning Invoice, Noffer string, Lnurl, or Lightning Address",
			);
			commit(input);
		} catch {
			/* dismissed */
		}
	};

	const canPay =
		recipientState.status === "parsedOk" &&
		amountChange.sats != null &&
		source.maxWithdrawableSats >= amountChange.sats;


	const handleReviewPayment = async () => {
		if (reviewing.current) return;
		if (recipientState.status !== "parsedOk" || amountChange.sats == null) return;

		reviewing.current = true;
		const parsed = recipientState.parsedData;
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
			if (!confirmed) return;

			try {
				dispatch(sendInvoicePayment({
					sourceId,
					parsedInvoice: invoice,
					amount,
					note: confirmed.note,
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
					<IonInput
						ref={recipientRef}
						className={cn(
							"filled-input min-h-14",
							recipientState.status === "error" && "ion-invalid",
							isTouched && "ion-touched",
						)}
						label="Recipient"
						labelPlacement="stacked"
						fill="solid"
						mode="md"
						color="primary"
						onIonBlur={() => setIsTouched(true)}
						placeholder="Paste invoice, Noffer, LNURL, or Lightning address"
						errorText={
							recipientState.status === "error"
								? recipientState.error
								: undefined
						}
						value={recipient}
						onIonInput={(e) => onRecipientInput(e.detail.value || "")}
					>
						<IonButton
							slot="end"
							fill="clear"
							size="small"
							color="medium"
							className="m-0 !aspect-auto !min-h-8"
							aria-label="scan"
							onClick={() => void openScan()}
						>
							<IonIcon slot="icon-only" icon={qrCodeOutline} />
						</IonButton>
					</IonInput>
					{recipientState.status === "loading" && (
						<ParseStatusHint state={recipientState} />
					)}
					<div className="mt-4">
						{recipientState.status === "parsedOk" ? (
							<RecipientInfoCard
								parsed={recipientState.parsedData}
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
	);
}
