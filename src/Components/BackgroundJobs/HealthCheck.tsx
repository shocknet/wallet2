import { useCallback, useEffect, useMemo } from "react"
import { getAllNostrClients, getNostrClient, nostrCallback, subToBeacons } from "../../Api/nostr"
import { toast } from "react-toastify";
import Toast from "../Toast";
import { useDispatch, useSelector } from "../../State/store";
import { editPaySources } from "../../State/Slices/paySourcesSlice";
import { editSpendSources } from "../../State/Slices/spendSourcesSlice";

const SubsCheckIntervalMs = 20 * 1000
const SubsThresholdMs = 10 * 1000
const BeaconMaxAgeSeconds = 2 * 60
export const HealthCheck = () => {
    const paySource = useSelector(({ paySource }) => paySource)
    const spendSource = useSelector(({ spendSource }) => spendSource)
    const dispatch = useDispatch();
    const updateSourceState = useCallback((source: string, state: { disconnected: boolean, name?: string }) => {
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
                dispatch({
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

                dispatch({
                    type: editSpendSources.type,
                    payload: update,
                    meta: { skipChangelog: true }
                })
            }
        }
    }, [paySource, spendSource])


    const checkHealth = useCallback(() => {
        getAllNostrClients().forEach((wrapper) => {
            const state = wrapper.getClientState()
            let oldestSingleSub: nostrCallback<any> | undefined = undefined
            wrapper.getSingleSubs().forEach(([_, cb]) => {
                if (!oldestSingleSub || oldestSingleSub.startedAtMillis > cb.startedAtMillis) {
                    oldestSingleSub = cb
                }
            })
            if (!oldestSingleSub) {
                console.log("no active single subs")
                return
            }
            const now = Date.now()
            const startedAtMillis = (oldestSingleSub as nostrCallback<any>).startedAtMillis
            if (now - startedAtMillis < SubsThresholdMs) {
                console.log("oldest single sub is less than ", SubsThresholdMs, " seconds old")
                return
            }
            console.log("oldest sub is", (startedAtMillis - now) / 1000, "seconds old!")
            if (now - state.latestResponseAtMillis <= SubsThresholdMs) {
                console.log("latest response is less than ", SubsThresholdMs, " seconds old")
                return
            }
            console.log("latest response is more than ", SubsThresholdMs, " seconds old, checking beacon state")
            wrapper.checkBeaconHealth(BeaconMaxAgeSeconds).then(beacon => {
                if (!beacon) {
                    console.log("service is down, beacon is older than", BeaconMaxAgeSeconds, "seconds, disconnecting")
                    wrapper.disconnectCalls()
                    toast.error(<Toast title="Source Error" message={`Cannot connect to source: ${wrapper.getPubDst().slice(0, 10)}.`} />)
                    updateSourceState(wrapper.getPubDst(), { disconnected: true, })
                    return
                }
                updateSourceState(wrapper.getPubDst(), { disconnected: false, name: beacon.data.name })

            })
        })

    }, [updateSourceState])

    useEffect(() => {
        const interval = setInterval(() => {
            checkHealth()
        }, SubsCheckIntervalMs)
        return () => {
            clearInterval(interval)
        }
    }, [checkHealth])

    useEffect(() => {
        return subToBeacons(up => {
            updateSourceState(up.createdByPub, { disconnected: false, name: up.name })
        })
    }, [updateSourceState])
    /*
        const updateSourceState = (source: string, connected: boolean) => {
            const payEntry = paySource.find(s => s.pasteField === source)
            if (payEntry) {
                dispatch(editPaySources({ ...payEntry, disconnected: !connected }))
            }
            const spendEntry = spendSource.find(s => s.pasteField === source)
            if (spendEntry) {
                dispatch(editSpendSources({ ...spendEntry, disconnected: !connected }))
            }
        }
    */
    return null
}