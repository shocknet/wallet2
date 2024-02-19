import { useEffect } from "react"
import { useDispatch, useSelector } from "../../State/store"
import { openNotification } from "../../constants"
import { disconnectNostrClientCalls, getAllNostrClients, getNostrClient, nostrCallback, parseNprofile } from "../../Api/nostr"
import { editPaySources } from "../../State/Slices/paySourcesSlice"
import { editSpendSources } from "../../State/Slices/spendSourcesSlice"
const SubsCheckIntervalSeconds = 60
export const HealthCheck = () => {
    // const paySource = useSelector(({ paySource }) => paySource)
    // const spendSource = useSelector(({ spendSource }) => spendSource)
    const dispatch = useDispatch();

    useEffect(() => {
        const interval = setInterval(() => {
            checkHealth()
        }, SubsCheckIntervalSeconds * 1000)
        return () => {
            clearInterval(interval)
        }
    }, [])

    const checkHealth = () => {
        getAllNostrClients().forEach(({ pubkey, client }) => {
            const state = client.getClientState()
            let oldestSingleSub: nostrCallback<any> | undefined = undefined
            state.clientCbs.forEach(([_, cb]) => {
                if (cb.type === 'single') {
                    if (!oldestSingleSub || oldestSingleSub.startedAtMillis > cb.startedAtMillis) {
                        oldestSingleSub = cb
                    }
                }
            })
            if (!oldestSingleSub) {
                console.log("no active single subs")
                return
            }
            const now = Date.now()
            const startedAtMillis = (oldestSingleSub as nostrCallback<any>).startedAtMillis
            if (now - startedAtMillis < 10 * 1000) {
                console.log("oldest single sub is less than 10 seconds old")
                return
            }
            console.log("oldest sub is", (startedAtMillis - now) / 1000, "seconds old!")
            if (now - state.latestResponseAtMillis < 10 * 1000) {
                console.log("latest response is less than 10 seconds old")
                return
            }
            if (state.latestHelthReqAtMillis <= state.latestResponseAtMillis) {
                console.log("no health req was sent since last response, sending health req")
                state.sendHelthRequest()
                return
            }
            if (now - state.latestHelthReqAtMillis < 10 * 1000) {
                console.log("latest health req is less than 10 seconds old")
                return
            }
            console.log("no response for more than 10 seconds, disconnecting")
            client.disconnectCalls()
            openNotification("top", "Error", "cannot connect to source: " + pubkey.slice(0, 10))
        })
    }
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