import store from "@/State/store/store";
import { getAllNostrClients, NostrCallback } from "./nostr";
import { toast } from "react-toastify";
import { editPaySources } from "@/State/Slices/paySourcesSlice";
import { editSpendSources } from "@/State/Slices/spendSourcesSlice";




let interval: ReturnType<typeof setInterval> | null = null;
const SUBS_CHECK_INTERVAL_MS = 20 * 1000;
const SUBS_THRESHOLD_MS = 10 * 1000;
const BEACON_MAX_AGE_SECONDS = 2 * 60;


function runHealthCheck() {
	getAllNostrClients().forEach((wrapper) => {
		const state = wrapper.getClientState()
		let oldestSingleSub: NostrCallback<any> | undefined = undefined
		wrapper.getSingleSubs().forEach(([_, cb]) => {
			if (!oldestSingleSub || oldestSingleSub.startedAtMillis > cb.startedAtMillis) {
				oldestSingleSub = cb
			}
		})
		if (!oldestSingleSub) {
			console.log("no active single subs");
			return
		}
		const now = Date.now()
		const startedAtMillis = (oldestSingleSub as NostrCallback<any>).startedAtMillis
		if (now - startedAtMillis < SUBS_THRESHOLD_MS) {
			console.log("oldest single sub is less than ", SUBS_CHECK_INTERVAL_MS, " seconds old")
			return
		}
		console.log("oldest sub is", (startedAtMillis - now) / 1000, "seconds old!", oldestSingleSub)
		if (now - state.latestResponseAtMillis <= SUBS_THRESHOLD_MS) {
			console.log("latest response is less than ", SUBS_THRESHOLD_MS, " seconds old")
			return
		}
		console.log("latest response is more than ", SUBS_THRESHOLD_MS, " seconds old, checking beacon state")
		wrapper.checkBeaconHealth(BEACON_MAX_AGE_SECONDS).then(beacon => {
			if (!beacon) {
				console.log("service is down, beacon is older than", BEACON_MAX_AGE_SECONDS, "seconds, disconnecting")
				wrapper.disconnectCalls()
				toast.error(`Cannot connect to source: ${wrapper.getPubDst().slice(0, 10)}.`)
				updateSourceState(wrapper.getPubDst(), { disconnected: true, })
				return
			} else {
				console.log("There is a beacon, your backgrounding sucks")
			}
			updateSourceState(wrapper.getPubDst(), { disconnected: false, name: beacon.data.name })

		})
	})
}


export function updateSourceState(source: string, state: { disconnected: boolean, name?: string }) {
	const paySource = store.getState().paySource;
	const spendSource = store.getState().spendSource;
	const payEntryId = paySource.order.find(s => s.startsWith(source))
	if (payEntryId) {
		const payEntry = paySource.sources[payEntryId]
		let doUpdate = false
		const update = { ...payEntry }
		if (payEntry.disconnected !== state.disconnected) {
			update.disconnected = state.disconnected
			doUpdate = true
		}
		if (state.name && payEntry.label !== state.name) {
			update.label = state.name
			doUpdate = true
		}
		if (doUpdate) {
			console.log("updating pay source", source)
			store.dispatch({
				type: editPaySources.type,
				payload: update,
				meta: { skipChangelog: true }
			})
		}
	}
	const spendEntryId = spendSource.order.find(s => s.startsWith(source))
	if (spendEntryId) {
		const spendEntry = spendSource.sources[spendEntryId]
		let doUpdate = false
		const update = { ...spendEntry }
		if (spendEntry.disconnected !== state.disconnected) {
			update.disconnected = state.disconnected
			doUpdate = true
		}
		if (state.name && spendEntry.label !== state.name) {
			update.label = state.name
			doUpdate = true
		}
		if (doUpdate) {
			console.log("updating spend source", source)

			store.dispatch({
				type: editSpendSources.type,
				payload: update,
				meta: { skipChangelog: true }
			})
		}
	}
}
export const startHealthCheckLoop = () => {
	if (interval) return;
	interval = setInterval(runHealthCheck, SUBS_CHECK_INTERVAL_MS);
}

export const stopHealthCheckLoop = () => {
	if (!interval) return;
	clearInterval(interval);
	interval = null;
}



