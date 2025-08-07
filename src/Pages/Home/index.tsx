import { useDispatch, useSelector } from "@/State/store";
import {
	IonButton,
	IonContent,
	IonFooter,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	RefresherEventDetail,
	useIonViewWillEnter
} from "@ionic/react";
import {
	downloadOutline,
	paperPlaneOutline,
	qrCodeOutline
} from "ionicons/icons";
import { RouteComponentProps } from "react-router";
import BalanceCard from "./BalanceCard";
import HomeHeader from "@/Layout2/HomeHeader";
import styles from "./styles/index.module.scss";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import type { SourceOperation } from "@/State/history/types";
import { App } from "@capacitor/app";
import { useToast } from "@/lib/contexts/useToast";
import { parseBitcoinInput as legacyParseBitcoinInput } from "../../constants";
import { InputClassification } from "@/lib/types/parse";
import { useQrScanner } from "@/lib/hooks/useQrScanner";
import { makeSelectSortedOperationsArray, removeOptimisticOperation, fetchAllSourcesHistory } from "@/State/history";
import { Virtuoso } from 'react-virtuoso'

const OperationModal = lazy(() => import("@/Components/Modals/OperationInfoModal"));
const HistoryItem = lazy(() => import("@/Components/HistoryItem"))



const Home: React.FC<RouteComponentProps> = (props: RouteComponentProps) => {
	const { history } = props;
	const dispatch = useDispatch();

	const { showToast } = useToast();

	const selectOperationsArray = useMemo(makeSelectSortedOperationsArray, []);
	const operations = useSelector(selectOperationsArray);


	useIonViewWillEnter(() => {
		dispatch(fetchAllSourcesHistory());

		let cleanupListener: (() => void) | undefined;

		App.addListener("appStateChange", (state) => {
			if (state.isActive) {
				dispatch(fetchAllSourcesHistory());
			}
		}).then(listener => {
			cleanupListener = () => listener.remove();
		});

		// If the user exits the app before an optimstic operation is done
		// then those optimistic operations should be removed
		// This is to prevent optimistic operations from being stuck in the history
		operations.forEach(op => {
			if ("optimistic" in op && op.optimistic) {
				if (op.type === "INVOICE") {
					dispatch(removeOptimisticOperation({ sourceId: op.sourceId, operationId: op.operationId }));
				} else {
					if (op.status === "broadcasting") {
						dispatch(removeOptimisticOperation({ sourceId: op.sourceId, operationId: op.operationId }));
					}
				}
			}
		});

		return () => {
			cleanupListener?.();
		}
	})

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
		const classification = identifyBitcoinInput(input);

		if (classification === InputClassification.UNKNOWN) {
			showToast({ message: "Unknown Recipient", color: "danger" });
			return;
		}
		try {
			const parsed = await parseBitcoinInput(input, classification);
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
	}



	return (
		<IonPage className="ion-page-width">
			<HomeHeader {...props}>
				<BalanceCard />
			</HomeHeader>
			<IonContent scrollY={false}>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				<Virtuoso
					style={{ height: "100%" }}
					data={operations}
					itemContent={(index, op) => (
						<div key={op.operationId} style={{ height: "56px", padding: "0 1rem" }}>
							<Suspense fallback={null}>
								<HistoryItem
									operation={op}
									handleSelectOperation={handleSelectOperation}
								/>
							</Suspense>
						</div>
					)}
				/>
			</IonContent>
			<IonFooter className={`ion-no-border ${styles["footer"]}`}>
				<div className={styles["toolbar"]}>
					<div className={styles["button-container"]}>
						<IonButton color="secondary" className={`${styles["toolbar-button"]} ${styles["toolbar-button-left"]}`} expand="full" routerLink="/receive" routerDirection="forward">
							<IonIcon slot="start" icon={downloadOutline} ></IonIcon>
							Receive
						</IonButton>
					</div>
					<div className={styles["button-container"]}>
						<IonButton color="secondary" className={`${styles["toolbar-button"]} ${styles["toolbar-button-right"]}`} expand="full" routerLink="/send" routerDirection="forward">
							<IonIcon slot="start" icon={paperPlaneOutline} ></IonIcon>
							Send
						</IonButton>
					</div>
					<IonButton shape="round" className={styles["fab-button"]} onClick={openScan}>
						<IonIcon slot="icon-only" icon={qrCodeOutline} />
					</IonButton>
				</div>
			</IonFooter>
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
		</IonPage>

	)
}

export default Home;
