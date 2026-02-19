
import {
	IonButton,
	IonContent,
	IonFooter,
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
	paperPlaneOutline,
	qrCodeOutline
} from "ionicons/icons";
import { useHistory } from "react-router";
import BalanceCard from "./BalanceCard";
import HomeHeader from "@/Layout2/HomeHeader";
import styles from "./styles/index.module.scss";
import { lazy, Suspense, useCallback, useState } from "react";
import { App } from "@capacitor/app";
import { useToast } from "@/lib/contexts/useToast";
import { parseBitcoinInput as legacyParseBitcoinInput } from "../../constants";
import { InputClassification } from "@/lib/types/parse";
import { useQrScanner } from "@/lib/hooks/useQrScanner";
import { Virtuoso } from 'react-virtuoso'
import HistoryItem from "@/Components/HistoryItem";


import { historySelectors } from "@/State/scoped/backups/sources/slice";
import { fetchAllSourcesHistory } from "@/State/scoped/backups/sources/history/thunks";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { SourceOperation } from "@/State/scoped/backups/sources/history/types";
import { useAlert } from "@/lib/contexts/useAlert";

const OperationModal = lazy(() => import("@/Components/Modals/OperationInfoModal"));



const Home = () => {
	const history = useHistory();

	const router = useIonRouter();
	const dispatch = useAppDispatch();

	const { showAlert } = useAlert();
	const { showToast } = useToast();

	const operations = useAppSelector(historySelectors.selectAll);


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
	}



	return (
		<IonPage 
			className="ion-page-width"
		>
			<HomeHeader>
				<BalanceCard />
			</HomeHeader>
		<IonContent 
			scrollY={false}
		>
			<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
				<IonRefresherContent></IonRefresherContent>
			</IonRefresher>
			<Virtuoso
				style={{ height: "100%" }}
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
								handleSelectOperation={handleSelectOperation}
							/>
						</div>
					)}
				/>
		</IonContent>
		<IonFooter className={`ion-no-border ${styles["footer"]}`}>
			<div className={styles["toolbar"]}>
				<div className={styles["button-container"]}>
					<IonButton color="light" className={`${styles["toolbar-button"]} ${styles["toolbar-button-left"]}`} expand="full" routerLink="/receive" routerDirection="forward">
						<IonIcon slot="start" icon={downloadOutline} ></IonIcon>
						Receive
					</IonButton>
				</div>
				<div className={styles["button-container"]}>
					<IonButton color="light" className={`${styles["toolbar-button"]} ${styles["toolbar-button-right"]}`} expand="full" routerLink="/send" routerDirection="forward">
						<IonIcon slot="start" icon={paperPlaneOutline} ></IonIcon>
						Send
					</IonButton>
				</div>
				<IonButton color="primary" shape="round" className={styles["fab-button"]} onClick={openScan}>
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
