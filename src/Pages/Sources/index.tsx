import AddSourceNavModal from "@/Components/Modals/Sources/AddSourceModal";
import { EditSourceModal } from "@/Components/Modals/Sources/EditSourceModal";
import SourceCard from "@/Components/SourceCard";
import { selectSourceViews, SourceView } from "@/State/scoped/backups/sources/selectors";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	IonContent,
	IonFab,
	IonFabButton,
	IonHeader,
	IonIcon,
	IonList,
	IonPage,
	IonTitle,
	IonToolbar,
	useIonModal,
	useIonViewDidEnter
} from "@ionic/react";
import { add } from "ionicons/icons";
import { useCallback, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { InputState } from "../Send/types";
import { InputClassification, ParsedLnurlWithdrawInput, ParsedNprofileInput } from "@/lib/types/parse";
import { useToast } from "@/lib/contexts/useToast";
import { SweepLnurlwDialog } from "@/Components/Modals/DialogeModals";
import { Satoshi } from "@/lib/types/units";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { requestLnurlWithdraw } from "@/lib/lnurl/withdraw";
import { SourceType } from "@/State/scoped/common";
import { createNostrInvoice } from "@/Api/helpers";
import { getInvoiceForLnurlPay } from "@/lib/lnurl/pay";
import HomeHeader from "@/Layout2/HomeHeader";
import { removeSource } from "@/State/scoped/backups/sources/thunks";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";

const SourcesPage = () => {
	const history = useHistory();
	const dispatch = useAppDispatch();
	const sources = useAppSelector(selectSourceViews);
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);

	const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);


	const { showToast } = useToast();
	const [lnurwAmount, setLnurlwAmount] = useState<Satoshi>(0 as Satoshi);

	const [presentSweepLnurlw, dismissLnurlw] = useIonModal(
		<SweepLnurlwDialog lnurlwAmount={lnurwAmount} dismiss={(data: { selectedSource: SourceView } | null, role: "cancel" | "confirm") => dismissLnurlw(data, role)} />
	);





	const selectedSource = useMemo(() => {
		return sources.find(s => s.sourceId === selectedSourceId) ?? null
	}, [selectedSourceId, sources])


	const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);

	const onAddClose = useCallback(() => {
		setIsAddSourceOpen(false)
	}, []);

	const [integrationData, setIntegrationData] = useState<{
		token: string,
		lnAddress: string
	} | undefined>(undefined);
	const [inviteToken, setInviteToken] = useState<string | undefined>(undefined);


	const [receivedInputState, setReceivedInputState] = useState<InputState>({
		status: "idle",
		inputValue: ""
	});

	const handleSearchParams = useCallback((search: URLSearchParams) => {
		const addressSearch = new URLSearchParams(search);
		const sourceString = addressSearch.get("addSource");
		if (!sourceString) {
			return;
		}
		const token = addressSearch.get("token");
		const lnAddress = addressSearch.get("lnAddress");
		const invToken = addressSearch.get("inviteToken");
		if (invToken) {
			setInviteToken(invToken)
		}
		if (token && lnAddress) {
			setIntegrationData({ token, lnAddress })
		}
		import("@/lib/parse")
			.then(({ identifyBitcoinInput, parseBitcoinInput }) => {
				const { classification, value: normalizedInput } = identifyBitcoinInput(
					sourceString,
					{
						allowed: [InputClassification.NPROFILE, InputClassification.LN_ADDRESS]
					}
				);
				if (classification === InputClassification.UNKNOWN) {
					setReceivedInputState({ status: "error", inputValue: normalizedInput, classification, error: "Unidentified input" });
					return;
				}
				setReceivedInputState({
					status: "loading",
					inputValue: normalizedInput,
					classification
				});

				parseBitcoinInput(normalizedInput, classification)
					.then(parsed => {
						setReceivedInputState({
							status: "parsedOk",
							inputValue: normalizedInput,
							parsedData: parsed
						});
						setIsAddSourceOpen(true)
					})
					.catch((err: any) => {
						setReceivedInputState({
							status: "error",
							inputValue: normalizedInput,
							error: err.message,
							classification
						});
					})
			})
			.catch(() => {
				showToast({ message: 'Failed to lazy-load "@/lib/parse"', color: "danger" })
			})
	}, [showToast]);

	const handleLnurlWithdraw = useCallback(async (parsedLnurlW: ParsedLnurlWithdrawInput) => {
		if (sources.length === 0) return;
		if (parsedLnurlW.max <= 0) return;
		const amount = parsedLnurlW.max
		setLnurlwAmount(amount);

		presentSweepLnurlw({
			onDidDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
				if (event.detail.role === "cancel") return;
				if (event.detail.role === "confirm") {

					const selectedSource = event.detail.data.selectedSource as SourceView
					let invoice = ""
					try {
						if (selectedSource.type === SourceType.LIGHTNING_ADDRESS_SOURCE) {

							const { pr } = await getInvoiceForLnurlPay({
								lnUrlOrAddress: selectedSource.sourceId,
								amountSats: amount,
							});
							invoice = pr;
						} else {
							invoice = await createNostrInvoice({
								pubkey: selectedSource.lpk,
								relays: selectedSource.relays
							},
								selectedSource.keys,
								amount,
							);
						}
						await requestLnurlWithdraw({
							lnurl: parsedLnurlW.data,
							invoice,
							amountSats: amount,

						})
					} catch (err: any) {
						showToast({
							message: err?.message || "An error occured while sweeping lnurl-w",
							color: "danger"
						});
					}

				}
			}
		})

	}, [sources, presentSweepLnurlw, showToast]);




	useIonViewDidEnter(() => {
		const { parsedLnurlW } = history.location.state as { parsedLnurlW?: ParsedLnurlWithdrawInput } || {};
		const { parsedNprofile } = history.location.state as { parsedNprofile?: ParsedNprofileInput } || {};
		const searchParams = new URLSearchParams(history.location.search);
		if (parsedLnurlW) {
			handleLnurlWithdraw(parsedLnurlW)
		} else if (parsedNprofile) {
			setReceivedInputState({
				status: "parsedOk",
				parsedData: parsedNprofile,
				inputValue: parsedNprofile.data
			});
			setIsAddSourceOpen(true);
		} else if (searchParams.size > 0) {
			const searchParams = new URLSearchParams(history.location.search);
			handleSearchParams(searchParams);
		}


		history.replace(history.location.pathname);
	}, [history.location.key]);

	const handleDelete = useCallback((sourceId: string) => {
		dispatch(removeSource(sourceId));
	}, [dispatch])

	const handleClose = useCallback(() => {
		setSelectedSourceId(null)
	}, [])

	const favoriteFirstSortedSources = useMemo(() => {
		if (favoriteSourceId == null) return sources;

		const i = sources.findIndex(s => s.sourceId === favoriteSourceId);
		if (i <= 0) return sources;

		const copy = [...sources];
		const [fav] = copy.splice(i, 1);
		copy.unshift(fav);
		return copy;
	}, [sources, favoriteSourceId])

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<HomeHeader />
				<IonToolbar className="big-toolbar">
					<IonTitle className="android-centered-title">Attached Nodes</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<EditSourceModal
					source={selectedSource}
					onClose={handleClose}
					onDelete={handleDelete}
					open={!!selectedSource}
				/>
				<AddSourceNavModal
					receivedInputState={receivedInputState}
					open={isAddSourceOpen}
					onClose={onAddClose}
					integrationData={integrationData}
					invitationToken={inviteToken}
				/>
				<IonList lines="none">
					{
						favoriteFirstSortedSources.map(s => <SourceCard key={s.sourceId} source={s} onClick={() => setSelectedSourceId(s.sourceId)} />)
					}
				</IonList>

				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton color="primary" onClick={() => setIsAddSourceOpen(true)}>
						<IonIcon icon={add}></IonIcon>
					</IonFabButton>
				</IonFab>
			</IonContent>
		</IonPage>
	)
}

export default SourcesPage;
