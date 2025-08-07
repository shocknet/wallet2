import { useEffect } from "react";
import { selectNostrSpends, useDispatch, useSelector } from "@/State/store";
import { addNotification } from "@/State/Slices/notificationSlice";
import { toast } from "react-toastify";
import { useIonRouter } from "@ionic/react";
import axios, { isAxiosError } from "axios";
import { editSpendSources } from "@/State/Slices/spendSourcesSlice";
import { decodeLnurl } from "@/constants";

export const useBackupReminder = () => {
	const router = useIonRouter();
	const spendSource = useSelector((state) => state.spendSource)
	const nostrSpends = useSelector(selectNostrSpends);
	const paySource = useSelector((state) => state.paySource)
	const backupState = useSelector(state => state.backupStateSlice)
	const dispatch = useDispatch();
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
				"Please back up your credentials"
				,
				{
					onClick: () => router.push("/auth")
				}
			)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paySource, spendSource, dispatch, router]);


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
						toast.error(err.message);
					} else {
						console.log("Unknown error occured", err);
					}
				}
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router, dispatch])
}
