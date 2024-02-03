import { useEffect } from "react"
import { useDispatch, useSelector } from "../../State/store"
import { NOSTR_PUB_DESTINATION, NOSTR_RELAYS, OLD_NOSTR_PUB_DESTINATION, options } from "../../constants"
import { addSpendSources } from "../../State/Slices/spendSourcesSlice"
import { nip19 } from "nostr-tools"
export const NewSourceCheck = () => {
    const paySource = useSelector(({ paySource }) => paySource)
    const spendSource = useSelector(({ spendSource }) => spendSource)
    const dispatch = useDispatch();

    useEffect(() => {
        if (OLD_NOSTR_PUB_DESTINATION === NOSTR_PUB_DESTINATION) {
            return
        }
        const newProfile = nip19.nprofileEncode({ pubkey: NOSTR_PUB_DESTINATION, relays: NOSTR_RELAYS })
        const newBootstrapSource = spendSource.find(s => s.pasteField === newProfile)
        if (newBootstrapSource) {
            return
        }
        const oldProfile = nip19.nprofileEncode({ pubkey: OLD_NOSTR_PUB_DESTINATION, relays: NOSTR_RELAYS })
        const oldBootstrapSource = spendSource.find(s => s.pasteField === oldProfile)
        if (!oldBootstrapSource) {
            return
        }
        console.log("bootstrap source changed, updating source")

        dispatch(addSpendSources({
            id: spendSource.length,
            label: "Bootstrap Node",
            pasteField: newProfile,
            option: options.little,
            icon: "0",
            balance: "0",
        }))
    }, [])



    return null
}