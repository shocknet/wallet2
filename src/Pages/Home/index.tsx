
import {
	IonButton,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	RefresherEventDetail,
	useIonViewDidEnter,
} from "@ionic/react";
import {
	downloadOutline,
	scanOutline,
} from "ionicons/icons";
import { useHistory } from "react-router";
import type { HomePageNavState } from "./nav";
import BalanceCard from "./BalanceCard";
import styles from "./styles/index.module.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { useToast } from "@/lib/contexts/useToast";
import { resolveAppIntent } from "@/intents";
import { useQrScanner } from "@/Hooks/useQrScanner";
import { Virtuoso } from 'react-virtuoso'
import HistoryItem from "@/Components/HistoryItem";


import { historySelectors } from "@/State/scoped/backups/sources/slice";
import { fetchAllSourcesHistory } from "@/State/scoped/backups/sources/history/thunks";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { SourceOperation } from "@/State/scoped/backups/sources/history/types";
import { useOperationInfoModal } from "@/Components/Modals/OperationInfoModal";
import { makeKey } from "@/State/scoped/backups/sources/history/helpers";
import HomePageToolbar from "@/Layout2/HomePageToolbar";


const Home = () => {
	const history = useHistory<HomePageNavState>();
	const dispatch = useAppDispatch();

	const { showToast } = useToast();
	const askOperationInfo = useOperationInfoModal();

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
		const { notif_op_id, sourceId } = history.location.state ?? {};
		if (!notif_op_id || !sourceId) return;
		const key = makeKey(sourceId, notif_op_id);
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


	const handleSelectOperation = useCallback((operation: SourceOperation) => {
		void askOperationInfo(operation);
	}, [askOperationInfo]);


	const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
		await dispatch(fetchAllSourcesHistory());
		event.detail.complete();
	}, [dispatch]);


	const handleScanned = useCallback(async (input: string) => {
		if (!input.trim()) {
			showToast({ message: "Empty input", color: "danger" });
			return;
		}
		try {
			await dispatch(resolveAppIntent(input));
		} catch (err: unknown) {
			showToast({ message: err instanceof Error ? err.message : "Unknown error occured", color: "danger" });
		}
	}, [dispatch, showToast]);


	const { scanSingleBarcode } = useQrScanner();
	const openScan = async () => {
		const scanned = await scanSingleBarcode("Scan a Lightning Invoice, Noffer string, Bitcoin Address, Lnurl, or Lightning Address");
		if (scanned.role === "confirm") handleScanned(scanned.data);
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
					components={{
						Footer: () => <div className="h-[6rem]" aria-hidden />,
					}}
					itemContent={(_, op) => (
						<div className="px-4">
							<HistoryItem
								key={op.opKey}
								operation={op}
								className={op.opKey === highlightOpKey ? styles["highlight-row"] : undefined}
								handleSelectOperation={handleSelectOperation}
							/>
						</div>
					)}
				/>
				<div
					slot="fixed"
					className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-[var(--ion-safe-area-bottom,0px)]"
				>

					<div
						aria-hidden
						className="
							pointer-events-none absolute inset-x-[-8%] bottom-[-1.25rem] z-0 h-60 blur-[1px]
							bg-[radial-gradient(ellipse_88%_78%_at_50%_92%,rgba(var(--app-box-shadow-color),0.24)_0%,rgba(var(--app-box-shadow-color),0.12)_30%,rgba(var(--app-box-shadow-color),0.04)_55%,transparent_78%),linear-gradient(to_top,rgba(var(--app-box-shadow-color),0.13)_0%,rgba(var(--app-box-shadow-color),0.05)_42%,transparent_75%)]
							dark:bg-[radial-gradient(ellipse_88%_78%_at_50%_92%,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.44)_26%,rgba(0,0,0,0.18)_52%,rgba(0,0,0,0.05)_72%,transparent_86%),linear-gradient(to_top,rgba(0,0,0,0.36)_0%,rgba(0,0,0,0.15)_38%,rgba(0,0,0,0.04)_68%,transparent_100%)]
							[mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]
							[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]
						"
					/>
					<div className="pointer-events-auto relative mx-0 flex h-[5.5rem] items-center">
						<div
							className="
								relative flex h-[3rem] w-full items-center justify-between rounded-full bg-[var(--back-button-color)]
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

