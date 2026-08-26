
import {
	IonButton,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	RefresherEventDetail,
	useIonRouter,
	useIonViewDidEnter,
} from "@ionic/react";
import {
	downloadOutline,
	scanOutline,
} from "ionicons/icons";
import { useHistory } from "react-router";
import type { HomePageNavState } from "./nav";
import { navToSend, isSendParsedInput } from "@/Pages/Send/nav";
import { navToSources } from "@/Pages/Sources/nav";
import BalanceCard from "./BalanceCard";
import styles from "./styles/index.module.scss";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { useToast } from "@/lib/contexts/useToast";
import { identifyBitcoinInput, parseBitcoinInput } from "@/lib/parse";
import { InputClassification } from "@/lib/types/parse";
import { useQrScanner } from "@/Hooks/useQrScanner";
import { Virtuoso } from 'react-virtuoso'
import HistoryItem from "@/Components/HistoryItem";


import { historySelectors } from "@/State/scoped/backups/sources/slice";
import { fetchAllSourcesHistory } from "@/State/scoped/backups/sources/history/thunks";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { SourceOperation } from "@/State/scoped/backups/sources/history/types";
import { useAlert } from "@/lib/contexts/useAlert";
import { makeKey } from "@/State/scoped/backups/sources/history/helpers";
import HomePageToolbar from "@/Layout2/HomePageToolbar";

const OperationModal = lazy(() => import("@/Components/Modals/OperationInfoModal"));


const Home = () => {
	const history = useHistory<HomePageNavState>();

	const router = useIonRouter();
	const dispatch = useAppDispatch();

	const { showAlert } = useAlert();
	const { showToast } = useToast();

	const operations = useAppSelector(historySelectors.selectAll);
	const [highlightOpKey, setHighlightOpKey] = useState<string | null>(null);
	const highlightTimeoutRef = useRef<number | null>(null);


	useIonViewDidEnter(() => {
		dispatch(fetchAllSourcesHistory());

		let cleanupListener: (() => void) | undefined;

		App.addListener("appStateChange", (state) => {
			if (state.isActive) {
				dispatch(fetchAllSourcesHistory());
			}
		}).then(listener => {
			cleanupListener = () => listener.remove();
		});


		return () => {
			cleanupListener?.();
		}
	})


	useIonViewDidEnter(() => {
		const { reason } = history.location.state ?? {};

		if (reason) {
			history.replace(history.location.pathname + history.location.search);
			showAlert({
				header: "Cannot access",
				message: reason,
				buttons: [
					{
						text: "Cancel",
						role: "cancel",

					},
					{
						text: "Manage Connections",
						role: "confirm",
					},
				]
			}).then(({ role }) => {
				if (role === "confirm") {
					router.push("/sources", "forward");
				}
			})
		}
	}, [history.location.key]);

	useIonViewDidEnter(() => {
		const { notif_op_id, sourceId } = history.location.state ?? {};
		if (!notif_op_id || !sourceId) return;
		const key = makeKey(sourceId, notif_op_id);
		console.log("[Home] Setting highlight key:", key);
		setHighlightOpKey(key);
		history.replace(history.location.pathname + history.location.search);
	}, [history.location.key]);

	useEffect(() => {
		if (!highlightOpKey) {
			if (highlightTimeoutRef.current) {
				window.clearTimeout(highlightTimeoutRef.current);
				highlightTimeoutRef.current = null;
			}
			return;
		}
		if (highlightTimeoutRef.current) return;
		const exists = operations.some(op => highlightOpKey === op.opKey);
		if (!exists) return;
		highlightTimeoutRef.current = window.setTimeout(() => {
			setHighlightOpKey(null);
			highlightTimeoutRef.current = null;
		}, 3000);
	}, [highlightOpKey, operations]);

	useEffect(() => {
		return () => {
			if (highlightTimeoutRef.current) {
				window.clearTimeout(highlightTimeoutRef.current);
				highlightTimeoutRef.current = null;
			}
		};
	}, []);


	const [selectedOperation, setSelectedOperation] = useState<SourceOperation | null>(null);
	const [loadOperationModal, setLoadOperationModal] = useState(false);


	const handleSelectOperation = useCallback((operation: SourceOperation) => {
		setSelectedOperation(operation);
		if (!loadOperationModal) {
			setLoadOperationModal(true);
		}
	}, [loadOperationModal]);


	const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
		await dispatch(fetchAllSourcesHistory());
		event.detail.complete();
	}, [dispatch]);


	const handleScanned = useCallback(async (input: string) => {
		if (!input.trim()) {
			showToast({ message: "Empty input", color: "danger" });
			return;
		}
		const { classification, value } = identifyBitcoinInput(input);

		try {
			if (classification === InputClassification.UNKNOWN) {
				throw new Error("Unknown input");
			}
			const parsed = await parseBitcoinInput(value, classification);
			if (parsed.type === InputClassification.LNURL_WITHDRAW) {
				navToSources(history, { parsedLnurlW: parsed });
				return;
			}
			if (parsed.type === InputClassification.NPROFILE) {
				navToSources(history, { parsedNprofile: parsed });
				return;
			}
			if (isSendParsedInput(parsed)) {
				navToSend(history, { parsed });
				return;
			}
			throw new Error(`${parsed.type} not usuable`);
		} catch (err: unknown) {
			showToast({ message: err instanceof Error ? err.message : "Unknown error occured", color: "danger" });
			return;
		}
	}, [history, showToast]);


	const { scanSingleBarcode } = useQrScanner();
	const openScan = async () => {
		try {
			const scanned = await scanSingleBarcode("Scan a Lightning Invoice, Noffer string, Bitcoin Address, Lnurl, or Lightning Address");
			handleScanned(scanned);
		} catch {
			/*  */
		}
	};


	return (
		<IonPage
			className="ion-page-width"
		>
			<IonHeader className="ion-no-border">
				<HomePageToolbar />
				<BalanceCard />
			</IonHeader>
			<IonContent scrollY={false} className="ion-content-no-footer">
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				<Virtuoso
					style={{ height: "100%" }}
					data={operations}
					defaultItemHeight={56}
					components={{
						Footer: () => <div className="h-[6rem]" aria-hidden />,
					}}
					itemContent={(_, op) => (
						<div
							key={op.operationId}
							style={{
								minHeight: 56,
								padding: "0 1rem"
							}}
						>
							<HistoryItem
								operation={op}
								className={op.opKey === highlightOpKey ? styles["highlight-row"] : undefined}
								handleSelectOperation={handleSelectOperation}
							/>
						</div>
					)}
				/>
				{
					loadOperationModal &&
					<Suspense fallback={null}>
						<OperationModal
							operation={selectedOperation}
							isOpen={!!selectedOperation}
							onClose={() => setSelectedOperation(null)}
						/>
					</Suspense>
				}
				<div
					slot="fixed"
					className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3"
				>

					<div
						aria-hidden
						className="
							pointer-events-none absolute inset-x-[-8%] bottom-[-1.25rem] z-0
							h-60 blur-[1px]
							bg-[radial-gradient(ellipse_88%_78%_at_50%_92%,rgba(var(--app-box-shadow-color),0.24)_0%,rgba(var(--app-box-shadow-color),0.12)_30%,rgba(var(--app-box-shadow-color),0.04)_55%,transparent_78%),linear-gradient(to_top,rgba(var(--app-box-shadow-color),0.13)_0%,rgba(var(--app-box-shadow-color),0.05)_42%,transparent_75%)]
							dark:bg-[radial-gradient(ellipse_88%_78%_at_50%_92%,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.44)_26%,rgba(0,0,0,0.18)_52%,rgba(0,0,0,0.05)_72%,transparent_86%),linear-gradient(to_top,rgba(0,0,0,0.36)_0%,rgba(0,0,0,0.15)_38%,rgba(0,0,0,0.04)_68%,transparent_100%)]
							[mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]
							[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]
						"
					/>
					<div className="pointer-events-auto relative mx-0 flex h-[5.5rem] items-center">
						<div
							className="
								relative flex h-[3rem] w-full items-center justify-between rounded-full
								bg-[var(--back-button-color)]
								shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(var(--app-box-shadow-color),0.14),0_2px_8px_rgba(var(--app-box-shadow-color),0.08)]
								dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_32px_rgba(0,0,0,0.4),0_2px_10px_rgba(0,0,0,0.25)]
							"
						>
							<IonButton
								fill="clear"
								routerLink="/receive"
								routerDirection="forward"
								className="
									m-0 h-full min-h-0 flex-1 normal-case tracking-normal
									text-[0.95rem] font-medium
									[--color:var(--app-text-primary)]
								"
							>
								<IonIcon slot="start" icon={downloadOutline} />
								Receive
							</IonButton>

							<div className="w-24 shrink-0" aria-hidden />

							<IonButton
								fill="clear"
								routerLink="/send"
								routerDirection="forward"
								className="
									m-0 h-full min-h-0 flex-1 normal-case tracking-normal
									text-[0.95rem] font-medium
									[--color:var(--app-text-primary)]
								"
							>
								<IonIcon
									slot="start"
									icon={downloadOutline}
									className="-scale-y-100"
								/>
								Pay
							</IonButton>
						</div>
						<IonButton
							color="primary"
							shape="round"
							onClick={openScan}
							aria-label="Scan"
							className="
								absolute left-1/2 top-1/2 z-[2] m-0
								h-[5.5rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2
								[--box-shadow:0_0_0_1px_rgba(var(--app-box-shadow-color),0.28),0_8px_22px_rgba(var(--app-box-shadow-color),0.16),0_0_28px_rgba(var(--app-box-shadow-color),0.08)]
								dark:[--box-shadow:0_0_0_1px_rgba(var(--app-box-shadow-color),0.48),0_10px_28px_rgba(0,0,0,0.4),0_0_40px_rgba(0,0,0,0.22)]
								[&_ion-icon]:text-[2rem]
							"
						>
							<IonIcon slot="icon-only" icon={scanOutline} />
						</IonButton>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
}

export default Home;
export { navToHome } from "./nav";
export type { HomePageNavState } from "./nav";

