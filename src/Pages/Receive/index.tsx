import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
	type ReactNode,
} from "react";
import {
	IonButton,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonLabel,
	IonPage,
	IonSegment,
	IonSegmentButton,
	IonSegmentContent,
	IonSegmentView,
	IonSpinner,
	IonToolbar,
	useIonModal,
} from "@ionic/react";
import type { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import {
	atCircleOutline,
	flashOutline,
	logoBitcoin,
} from "ionicons/icons";
import QrCode from "@/Components/QrCode";
import { FiatDisplay } from "@/Components/FiatDisplay";
import EmptyState from "@/Components/common/ui/EmptyState";
import NewInvoiceModal from "@/Components/Modals/NewInvoiceModal";
import { SourceSelectionView } from "@/Components/Source/SourceSelectionView";
import { SourceReachabilityHint } from "@/Components/Source/SourceReachabilityHint";
import { SourceSelectSheet } from "@/Components/Source/SourceSelectSheet";
import StackPageToolbar from "@/Layout2/StackPageToolbar";
import { truncateTextMiddle } from "@/lib/format";
import { useToast } from "@/lib/contexts/useToast";
import type { Satoshi } from "@/lib/types/units";
import { formatSatoshi } from "@/lib/units";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import {
	type SourceView,
	selectSourceViews,
} from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import { useHistory, useLocation } from "react-router-dom";
import { navToSources } from "@/Pages/Sources/nav";
import {
	createInvoiceForSource,
	fetchRemotePayloads,
	METHOD_METAS,
	payloadForMethod,
	pickDefaultSource,
	type ReceiveMethodId,
} from "./helpers";
import {
	createInitialReceiveMethodsState,
	receiveMethodsReducer,
} from "./receiveMethodsReducer";

function methodIcon(id: ReceiveMethodId): string {
	switch (id) {
		case "ln-address":
			return atCircleOutline;
		case "chain":
			return logoBitcoin;
		case "noffer":
			return "nostr";
		case "invoice":
			return flashOutline;
	}
}

function segmentContentId(sourceId: string, methodId: ReceiveMethodId) {
	return `recv2-${sourceId}-${methodId}`;
}

export default function Receive2() {
	const sources = useAppSelector(selectSourceViews);

	return (
		<IonPage className="ion-page-width">
			{sources.length === 0 ? (
				<ReceiveEmpty />
			) : (
				<ReceiveSourceGate sources={sources} />
			)}
		</IonPage>
	);
}

function ReceiveEmpty() {
	const history = useHistory();
	const location = useLocation();

	return (
		<>
			<IonHeader className="ion-no-border">
				<StackPageToolbar title="Receive" />
			</IonHeader>
			<IonContent className="ion-padding">
				<EmptyState
					title="No sources"
					description="Add a source to receive payments"
					action={
						<IonButton
							color="primary"
							className="[--border-radius:12px]"
							expand="block"
							onClick={() => navToSources(history, { from: location })}
						>
							Go to sources
						</IonButton>
					}
				/>
			</IonContent>
		</>
	);
}


function ReceiveSourceGate({ sources }: { sources: SourceView[] }) {
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
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

	return (
		<>
			<IonHeader className="ion-no-border">
				<StackPageToolbar title="Receive" />
			</IonHeader>
			<ReceiveStage key={selectedSource.sourceId} source={selectedSource}>
				<div className="flex flex-col gap-2">
					<SourceSelectionView
						source={selectedSource}
						showTapToSwitch={false}
						onClick={() => setSheetOpen(true)}
					/>
					<SourceReachabilityHint source={selectedSource} />
				</div>
			</ReceiveStage>
			<SourceSelectSheet
				isOpen={sheetOpen}
				onDidDismiss={() => setSheetOpen(false)}
				selectedSourceId={selectedSourceId}
				onSelect={(source) => setSelectedSourceId(source.sourceId)}
				sources={sources}
				title="Receive into"
			/>
		</>
	);
}


function ReceiveStage({
	source,
	children,
}: {
	source: SourceView;
	children: ReactNode;
}) {
	const { showToast } = useToast();

	const [methodsState, dispatchMethods] = useReducer(
		receiveMethodsReducer,
		source,
		createInitialReceiveMethodsState,
	);
	const { payloads, method, invoice, invoiceLoading } = methodsState;

	const amountInputRef = useRef<HTMLIonInputElement>(null);

	useEffect(() => {
		const sourceId = source.sourceId;
		fetchRemotePayloads(source, (patch) => {
			dispatchMethods({ type: "patch", sourceId, patch });
		});
		// Remount on source switch via key; don't refetch on balance/beacon churn.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [source.sourceId]);


	const metaNoffer = source.noffer?.trim();

	useEffect(() => {
		if (!metaNoffer) return;
		dispatchMethods({
			type: "patch",
			sourceId: source.sourceId,
			patch: { noffer: metaNoffer },
		});
	}, [metaNoffer, source.sourceId]);

	const availableMethods = useMemo(
		() =>
			METHOD_METAS.filter(
				(m) => payloadForMethod(m.id, payloads) !== null,
			),
		[payloads],
	);

	const [presentInvoiceModal, dismissInvoiceModal] = useIonModal(NewInvoiceModal, {
		dismiss: (data: { amount: Satoshi, invoiceMemo: string, blind: boolean } | null, role?: string) => dismissInvoiceModal(data, role),
		ref: amountInputRef,
	});

	const createInvoice = useCallback(
		(amount: Satoshi, memo: string, blind: boolean) => {
			dispatchMethods({ type: "invoiceStart" });
			void createInvoiceForSource(source, amount, memo, blind)
				.then((invoiceData) => {
					dispatchMethods({
						type: "invoiceSuccess",
						invoice: invoiceData,
					});
				})
				.catch((err: unknown) => {
					showToast({
						message:
							err instanceof Error ? err.message : "Failed to create invoice",
						color: "danger",
					});
					dispatchMethods({ type: "invoiceError" });
				});
		},
		[source, showToast],
	);

	const openInvoiceModal = useCallback(() => {
		presentInvoiceModal({
			cssClass: "wallet-modal",
			onDidPresent: () => {
				amountInputRef.current?.setFocus();
			},
			onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
				if (event.detail.role !== "confirm") return;
				const data = event.detail.data as
					| { amount: Satoshi; invoiceMemo: string; blind: boolean }
					| null;
				if (!data) return;
				createInvoice(data.amount, data.invoiceMemo, data.blind);
			},
		});
	}, [presentInvoiceModal, createInvoice]);

	const showInvoiceTab = method === "invoice" || invoice != null;

	const segmentOptions: { id: ReceiveMethodId; label: string }[] = [
		...availableMethods.map((m) => ({ id: m.id, label: m.label })),
		...(showInvoiceTab ? [{ id: "invoice" as const, label: "Invoice" }] : []),
	];

	const segmentValue: ReceiveMethodId | undefined =
		method ?? segmentOptions[0]?.id;

	const selectMethod = (next: ReceiveMethodId | undefined) => {
		if (!next) return;
		dispatchMethods({ type: "selectMethod", method: next });
	};

	const segmentOptionsKey = segmentOptions.map((o) => o.id).join("|");

	return (
		<>
			<IonContent className="ion-padding">
				<div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 pt-2">
					{children}
					{segmentOptions.length > 0 && segmentValue ? (
						<div key={segmentOptionsKey} className="flex flex-col">
							<IonSegment
								value={segmentValue}
								onIonChange={(ev) =>
									selectMethod(ev.detail.value as ReceiveMethodId | undefined)
								}
								className="
									rounded-xl  wallet-box-shadow
									[--background:var(--app-surface)]
								"
							>
								{segmentOptions.map((m) => (
									<IonSegmentButton
										key={m.id}
										value={m.id}
										layout="icon-top"
										contentId={segmentContentId(source.sourceId, m.id)}
										className="
											[--background:var(--back-button-color)]
											[--background-checked:var(--back-button-color)]
										"
									>
										<IonIcon className="text-base" icon={methodIcon(m.id)} aria-hidden />
										<IonLabel>{m.label}</IonLabel>
									</IonSegmentButton>
								))}
							</IonSegment>

							<IonSegmentView className="min-h-[20rem]">
								{segmentOptions.map((m) => (
									<IonSegmentContent
										key={m.id}
										id={segmentContentId(source.sourceId, m.id)}
									>
										<MethodPane
											methodId={m.id}
											label={m.label}
											value={
												m.id === "invoice"
													? (invoice?.data ?? null)
													: payloadForMethod(m.id, payloads)
											}
											prefix={
												m.id === "invoice"
													? "lightning"
													: METHOD_METAS.find((meta) => meta.id === m.id)?.prefix
											}
											amountSats={
												m.id === "invoice" && invoice ? invoice.amount : null
											}
											loading={m.id === "invoice" && invoiceLoading}
										/>
									</IonSegmentContent>
								))}
							</IonSegmentView>
						</div>
					) : (
						<div className="flex min-h-[18rem] flex-1 flex-col items-center justify-center">
							<p className="m-0 max-w-xs text-center text-sm text-muted">
								No usable receive methods on this source yet. Create an invoice
								instead.
							</p>
						</div>
					)}
				</div>
			</IonContent>
			<IonFooter className="ion-no-border">
				<IonToolbar>
					<div className="mx-auto w-full max-w-md">
						<IonButton
							expand="block"
							color="primary"
							size="large"
							className="
								[--border-radius:12px]

							"
							onClick={openInvoiceModal}
							disabled={invoiceLoading}
						>
							{invoice ? "New invoice" : "Create invoice"}
						</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>
		</>
	);
}

function displayPayload(methodId: ReceiveMethodId, value: string): string {
	switch (methodId) {
		case "invoice":
			return truncateTextMiddle(value, 12, 12);
		case "noffer":
			return truncateTextMiddle(value, 12, 12);
		case "chain":
		case "ln-address":
			return value;
	}
}

function MethodPane({
	methodId,
	label,
	value,
	prefix,
	amountSats,
	loading,
}: {
	methodId: ReceiveMethodId;
	label: string;
	value: string | null;
	prefix?: string;
	amountSats: Satoshi | null;
	loading: boolean;
}) {
	const caption =
		methodId === "invoice"
			? "Lightning invoice"
			: label;

	const shown = value ? displayPayload(methodId, value) : "";

	return (
		<div className="flex min-h-[18rem] rounded-t-none flex-col items-center justify-center gap-3 px-1 py-2">
			{loading ? (
				<IonSpinner name="crescent" />
			) : value ? (
				<>
					<div className="w-full max-w-[22rem] sm:max-w-[24rem]">
						<QrCode value={value} prefix={prefix} />
					</div>
					<p className="m-0 max-w-full break-all px-2 text-center text-sm leading-snug text-primary">
						{shown}
					</p>
					{amountSats != null ? (
						<p className="m-0 text-center text-sm text-muted">
							{formatSatoshi(amountSats)} sats
							{" · "}
							<FiatDisplay sats={amountSats} />
						</p>
					) : null}
					<p className="m-0 text-center text-sm text-muted">
						{caption}
						{" · tap QR to copy"}
					</p>
				</>
			) : (
				<p className="m-0 max-w-xs text-center text-sm text-muted">
					Nothing to show for this method yet.
				</p>
			)}
		</div>
	);
}
