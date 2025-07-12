import HistoryItem from "@/Components/HistoryItem";
import { useDispatch, useSelector } from "@/State/store";
import {
	IonButton,
	IonContent,
	IonFooter,
	IonIcon,
	IonList,
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
import { makeSelectSortedOperationsArray } from "@/State/history/selectors";
import styles from "./styles/index.module.scss";
import { useCallback, useMemo, useState } from "react";
import { SourceOperation } from "@/State/history/types";
import OperationModal from "@/Components/Modals/OperationInfoModal";
import { fetchAllSourcesHistory } from "@/State/history/thunks";
import { App } from "@capacitor/app";
import { useToast } from "@/lib/contexts/useToast";
import { identifyBitcoinInput, parseBitcoinInput } from "@/lib/parse";
import { parseBitcoinInput as legacyParseBitcoinInput } from "../../constants";
import { InputClassification } from "@/lib/types/parse";
import { removeOptimisticOperation } from "@/State/history";
import { useQrScanner } from "@/lib/hooks/useQrScanner";



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



	const handleSelectOperation = useCallback((operation: SourceOperation) => {
		setSelectedOperation(operation);
	}, []);


	const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
		await dispatch(fetchAllSourcesHistory());
		event.detail.complete();
	}, [dispatch]);


	const handleScanned = useCallback(async (input: string) => {
		if (!input.trim()) {
			showToast({ message: "Empty input", color: "danger" });
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
			<IonContent>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				<IonList lines="full" inset>
					{operations.map(op => (
						<HistoryItem key={op.operationId} operation={op} handleSelectOperation={handleSelectOperation} />
					))}
				</IonList>

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
			<OperationModal
				operation={selectedOperation}
				isOpen={!!selectedOperation}
				onClose={() => setSelectedOperation(null)}
			/>
		</IonPage>

	)
}

export default Home;
