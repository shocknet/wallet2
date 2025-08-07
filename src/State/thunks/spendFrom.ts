import { getNostrClient } from "@/Api/nostr";
import { appCreateAsyncThunk } from "../appCreateAsyncThunk";

export const getSourceInfo = appCreateAsyncThunk(
	"spendFrom/getSourceInfo",
	async (
		sourceId: string,
		{ getState, dispatch }
	) => {
		const source = getState().spendSource.sources[sourceId];
		if (!source.pubSource) {
			throw new Error("Not a pub source");
		}


		const client = await getNostrClient(source.pasteField, source.keys);
		const res = await client.GetUserInfo()
		console.log({ userInfo: res })
		if (res.status === 'ERROR') {
			throw new Error(res.reason)
		}
		dispatch({
			type: "spendSources/editSpendSources",
			payload: {
				...source,
				balance: `${res.balance}`,
				maxWithdrawable: `${res.max_withdrawable}`,
				ndebit: res.ndebit,
			},
			meta: { skipChangelog: true }
		})
		const paySourceToEdit = getState().paySource.sources[source.id]
		if (paySourceToEdit && res.bridge_url && !paySourceToEdit.bridgeUrl) {
			dispatch({
				type: "paySources/editPaySources",
				payload: {
					...paySourceToEdit,
					bridgeUrl: res.bridge_url
				},
				meta: { skipChangelog: true }
			})
		}
	})
