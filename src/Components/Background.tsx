import { useEffect } from "react";
import { selectNostrSpends, useDispatch, useSelector } from "../State/store";
import { addNotification } from "../State/Slices/notificationSlice";
import { decodeLnurl } from "../constants";
import { useIonRouter } from "@ionic/react";
import { editSpendSources } from "../State/Slices/spendSourcesSlice";
import axios, { isAxiosError } from "axios";
import { SubscriptionsBackground } from "./BackgroundJobs/subscriptions";
import { LnAddressCheck } from "./BackgroundJobs/LnAddressCheck";
import { NewSourceCheck } from "./BackgroundJobs/NewSourceCheck";
import { NodeUpCheck } from "./BackgroundJobs/NodeUpCheck";
import { toast } from "react-toastify";
import Toast from "./Toast";
import { RemoteBackup } from "./BackgroundJobs/RemoteBackup";
import { DebitRequestHandler } from "./BackgroundJobs/DebitRequestHandler";
import { subToBeacons } from "@/Api/nostr";
import { updateSourceState } from "@/Api/health";




export const Background = () => {
	const router = useIonRouter();

	const spendSource = useSelector((state) => state.spendSource)
	const nostrSpends = useSelector(selectNostrSpends);
	const paySource = useSelector((state) => state.paySource)
	const backupState = useSelector(state => state.backupStateSlice)
	const dispatch = useDispatch();


	window.onbeforeunload = function () { return null; };

	useEffect(() => {
		const handleBeforeUnload = () => {
			// Call your function here
			localStorage.setItem("userStatus", "offline");
			return false;
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			return window.removeEventListener('beforeunload', handleBeforeUnload);
		}
	}, []);


	useEffect(() => {
		const otherPaySources = Object.values(paySource.sources).filter((e) => !e.pubSource);
		const otherSpendSources = Object.values(spendSource.sources).filter((e) => !e.pubSource);

		if ((nostrSpends.length !== 0 && nostrSpends[0].balance !== "0") || (otherPaySources.length > 0 || otherSpendSources.length > 0)) {
			if (localStorage.getItem("isBackUp") === "1" || backupState.subbedToBackUp) {
				return;
			}
			dispatch(addNotification({
				header: 'Reminder',
				icon: '⚠️',
				desc: 'Back up your credentials!',
				date: Date.now(),
				link: '/auth',
			}))
			localStorage.setItem("isBackUp", "1")
			toast.warn(
				<Toast
					title="Reminder"
					message="Please back up your credentials"
				/>,
				{
					onClick: () => router.push("/auth")
				}
			)
		}
	}, [paySource, spendSource, dispatch, router])




	// reset spend for lnurl
	useEffect(() => {
		const sources = Object.values(spendSource.sources);
		sources.filter(s => !s.disabled).forEach(async source => {
			if (!source.pubSource) {
				try {
					const lnurlEndpoint = decodeLnurl(source.pasteField);
					const response = await axios.get(lnurlEndpoint);
					const updatedSource = { ...source };
					const amount = Math.round(response.data.maxWithdrawable / 1000).toString()
					if (amount !== updatedSource.balance) {
						updatedSource.balance = amount;
						updatedSource.maxWithdrawable = amount;
						dispatch(editSpendSources(updatedSource));
					}
				} catch (err) {
					if (isAxiosError(err) && err.response) {
						dispatch(addNotification({
							header: 'Spend Source Error',
							icon: '⚠️',
							desc: `Spend source ${source.label} is saying: ${err.response.data.reason}`,
							date: Date.now(),
							link: `/sources?sourceId=${source.id}`,
						}))
						// update the erroring source
						dispatch({
							type: "spendSources/editSpendSources",
							payload: { ...source, disabled: err.response.data.reason },
							meta: { skipChangelog: true }
						});
					} else if (err instanceof Error) {
						toast.error(<Toast title="Source Error" message={err.message} />)
					} else {
						console.log("Unknown error occured", err);
					}
				}
			}
		})
	}, [router, dispatch])

	useEffect(() => {
		return subToBeacons(up => {
			updateSourceState(up.createdByPub, { disconnected: false, name: up.name })
		})
	}, [spendSource, paySource])





	return <div id="focus_div">
		<SubscriptionsBackground />
		<NewSourceCheck />
		<LnAddressCheck />
		<NodeUpCheck />
		<RemoteBackup />
		<DebitRequestHandler />
	</div>
}
