
import {
	IonButton,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonToolbar,
	RefresherEventDetail,
	useIonRouter,
	useIonViewDidEnter,
} from "@ionic/react";
import {
	downloadOutline,
	scanOutline,
} from "ionicons/icons";
import { useHistory } from "react-router";
import BalanceCard from "./BalanceCard";
import styles from "./styles/index.module.scss";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { useToast } from "@/lib/contexts/useToast";
import { parseBitcoinInput as legacyParseBitcoinInput } from "../../constants";
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
	const history = useHistory();

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
		const { reason } = history.location.state as { reason?: string } || {}

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
		const { notif_op_id, sourceId } = history.location.state as { notif_op_id?: string, sourceId?: string } || {}
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
		console.log("[Home] Highlight key exists in operations:", exists, { highlightOpKey, operationCount: operations.length });
		if (!exists) return;
		console.log("[Home] Starting highlight timeout (3s)");
		highlightTimeoutRef.current = window.setTimeout(() => {
			console.log("[Home] Clearing highlight");
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
		let identifyBitcoinInput;
		let parseBitcoinInput;

		try {
			({ identifyBitcoinInput, parseBitcoinInput } = await import('@/lib/parse'));
		} catch {
			showToast({ message: "Failed to lazy-load '@/lib/parse'", color: "danger" });
			return;
		}
		const { classification, value } = identifyBitcoinInput(input);

		if (classification === InputClassification.UNKNOWN) {
			showToast({ message: "Unknown Recipient", color: "danger" });
			return;
		}
		try {
			const parsed = await parseBitcoinInput(value, classification);
			if (parsed.type === InputClassification.LNURL_WITHDRAW) {
				const legacyParsedLnurlW = await legacyParseBitcoinInput(input);
				history.push({
					pathname: "/sources",
					state: legacyParsedLnurlW
				})
				return;
			} else {
				history.push({
					pathname: "/send",
					state: {
						// pass the input string as opposed to parsed object because in the case of noffer it needs the selected source
						input: parsed.data
					}
				})
			}
		} catch (err: any) {
			showToast({ message: err?.message || "Unknown error occured", color: "danger" });
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


	const [scrollParent, setScrollParent] = useState<HTMLElement | undefined>();





	return (
		<IonPage
			className="ion-page-width"
		>
			<IonHeader className="ion-no-border">
				<HomePageToolbar />
				<BalanceCard />
			</IonHeader>
			<IonContent
				fullscreen
				ref={(el) => el?.getScrollElement().then((el) => setScrollParent(el))}
			>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				<Virtuoso
					customScrollParent={scrollParent}
					data={operations}
					defaultItemHeight={56}
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
			</IonContent>
			<IonFooter translucent className="ion-no-border">
				<IonToolbar className="![--background:transparent]">
					<div className="mx-3 relative flex h-[5.5rem] items-center">
						<div
							aria-hidden
							className="
								pointer-events-none absolute inset-x-0 bottom-0 z-0
								h-[5.5rem]
								bg-gradient-to-b from-transparent via-black/10 to-transparent
								[mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]
								[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]
							"
						/>
						<div
							className="
								relative flex h-[3rem] w-full items-center justify-between rounded-lg
								bg-[var(--ion-color-dark)]
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
								[--box-shadow:0_0_0_1px_rgba(var(--app-box-shadow-color),0.48)]
								[&_ion-icon]:text-[2rem]
							"
						>
							<IonIcon slot="icon-only" icon={scanOutline} />
						</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>
		</IonPage>
	);
}

export default Home;
