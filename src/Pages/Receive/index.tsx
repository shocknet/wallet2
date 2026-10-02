import {
	useEffect,
	useReducer,
	useRef,
} from "react";
import {
	IonButton,
	IonContent,
	IonHeader,
	IonIcon,
	IonLabel,
	IonPage,
	IonSegment,
	IonSegmentButton,
	IonSegmentContent,
	IonSegmentView,
	IonToolbar,
} from "@ionic/react";
import {
	atCircleOutline,
	flashOutline,
	logoBitcoin,
} from "ionicons/icons";
import { SourceSelectionView } from "@/Components/Source/SourceSelectionView";
import { SourceReachabilityHint } from "@/Components/Source/SourceReachabilityHint";
import StackPageToolbar from "@/Layout2/StackPageToolbar";
import { useSourceSelection } from "@/Hooks/useSourceSelection";
import { useLiveSourceView } from "@/Hooks/useSourceView";
import { ChainPane } from "./ChainPane";
import { InvoicePane, type InvoicePaneHandle } from "./InvoicePane";
import { LnAddressPane } from "./LnAddressPane";
import { NofferPane } from "./NofferPane";
import "./receiveMethodTabs.css";
import {
	fetchRemotePayloads,
	RECEIVE_TAB_ORDER,
	type ReceiveMethodId,
} from "./helpers";
import {
	createInitialReceiveMethodsState,
	receiveMethodsReducer,
	type ReceiveHave,
} from "./receiveMethodsReducer";

type ReceiveSegment =
	| { method: "invoice"; label: string }
	| { method: "ln-address"; value: string; label: string }
	| { method: "chain"; value: string; label: string }
	| { method: "noffer"; value: string; label: string };

function segmentContentId(sourceId: string, methodId: ReceiveMethodId) {
	return `recv-${sourceId}-${methodId}`;
}

function receiveSegment(
	method: ReceiveMethodId,
	have: ReceiveHave,
): ReceiveSegment | null {
	switch (method) {
		case "ln-address":
			return have.lnAddress ? { method, value: have.lnAddress, label: "LN address" } : null;
		case "noffer":
			return have.noffer ? { method, value: have.noffer, label: "Noffer" } : null;
		case "chain":
			return have.chain ? { method, value: have.chain, label: "Chain" } : null;
		case "invoice":
			return { method, label: "Invoice" };
	}
}

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

export default function Receive() {
	const { sourceId, setOverrideSourceId } = useSourceSelection();

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<StackPageToolbar title="Receive" />
				<IonToolbar>
					<div className="mx-auto flex w-full max-w-md flex-col gap-2 px-5 md:px-0">
						<SourceSelectionView
							sourceId={sourceId}
							onSourceId={setOverrideSourceId}
							title="Receive into"
							showTapToSwitch={false}
						/>
						<SourceReachabilityHint sourceId={sourceId} />
					</div>
				</IonToolbar>
			</IonHeader>
			<ReceiveSource key={sourceId} sourceId={sourceId} />
		</IonPage>
	);
}

function ReceiveSource({ sourceId }: { sourceId: string }) {
	const source = useLiveSourceView(sourceId);
	const invoicePaneRef = useRef<InvoicePaneHandle>(null);
	const [state, dispatch] = useReducer(
		receiveMethodsReducer,
		source,
		createInitialReceiveMethodsState,
	);
	const { have, selection } = state;

	useEffect(() => {
		fetchRemotePayloads(source, (patch) => {
			dispatch({ type: "patch", patch });
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [source.sourceId]);

	const metaNoffer = source.noffer?.trim();
	const vanityName = source.vanityName?.trim();

	useEffect(() => {
		if (!metaNoffer && !vanityName) return;
		dispatch({ type: "patch", patch: { noffer: metaNoffer, lnAddress: vanityName } });
	}, [metaNoffer, vanityName]);

	const segmentOptions = RECEIVE_TAB_ORDER
		.map((method) => receiveSegment(method, have))
		.filter((segment): segment is ReceiveSegment => segment !== null);

	const selectMethod = (next: ReceiveMethodId) => {
		dispatch({ type: "selectMethod", method: next });
		if (next === "invoice" && selection !== "invoice") {
			requestAnimationFrame(() => {
				invoicePaneRef.current?.focusAmount();
			});
		}
	};

	const methodsKey = segmentOptions.map((m) => m.method).join(",");

	return (
		<IonContent className="ion-padding">
			<div className="flex h-full min-h-0 flex-col gap-4">
				<div className="mx-auto w-full max-w-lg overflow-hidden rounded-xl wallet-box-shadow">
					<IonSegment
						key={methodsKey}
						mode="ios"
						value={selection}
						className="receive-method-tabs"
						onIonChange={(ev) => {
							const value = ev.detail.value;
							if (
								typeof value !== "string" ||
								!segmentOptions.some((m) => m.method === value)
							) {
								return;
							}
							selectMethod(value as ReceiveMethodId);
						}}
					>
						{segmentOptions.map((m) => (
							<IonSegmentButton
								key={m.method}
								mode="ios"
								value={m.method}
								layout="icon-top"
								contentId={segmentContentId(source.sourceId, m.method)}
							>
								<IonIcon icon={methodIcon(m.method)} aria-hidden />
								<IonLabel>{m.label}</IonLabel>
							</IonSegmentButton>
						))}
					</IonSegment>
				</div>
				<IonSegmentView className="min-h-0 flex-1">
					{segmentOptions.map((m) => (
						<IonSegmentContent
							key={m.method}
							id={segmentContentId(source.sourceId, m.method)}
							className="h-full"
						>
							{m.method === "ln-address" ? (
								<LnAddressPane value={m.value} />
							) : m.method === "chain" ? (
								<ChainPane value={m.value} />
							) : m.method === "noffer" ? (
								<NofferPane value={m.value} />
							) : (
								<InvoicePane ref={invoicePaneRef} source={source} />
							)}
						</IonSegmentContent>
					))}
				</IonSegmentView>
				{
					selection !== "invoice" && (
						<div className="mx-auto w-full max-w-md">

							<IonButton
								expand="block"
								color="primary"
								size="large"
								className="[--border-radius:12px]"
								onClick={() => selectMethod("invoice")}
							>
								Create invoice
							</IonButton>
						</div>
					)
				}
			</div>
		</IonContent>

	);
}
