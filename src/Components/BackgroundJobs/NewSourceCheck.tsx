import { useEffect } from "react"
import { useDispatch, useSelector } from "../../State/store"
import { DEFAULT_BRIDGE_URL, NOSTR_PUB_DESTINATION, NOSTR_RELAYS, OLD_NOSTR_PUB_DESTINATION, options } from "../../constants"
import { addSpendSources } from "../../State/Slices/spendSourcesSlice"
import { encodeNprofile } from "../../custom-nip19";

export const NewSourceCheck = () => {
	const spendSource = useSelector(({ spendSource }) => spendSource)
	const dispatch = useDispatch();

	useEffect(() => {
		if (OLD_NOSTR_PUB_DESTINATION === NOSTR_PUB_DESTINATION) {
			return
		}
		if (spendSource.sources[NOSTR_PUB_DESTINATION]) {
			return
		}
		if (!spendSource.sources[OLD_NOSTR_PUB_DESTINATION]) {
			return;
		}


		console.log("bootstrap source changed, updating source")
		const newProfile = encodeNprofile({ pubkey: NOSTR_PUB_DESTINATION, relays: NOSTR_RELAYS, bridge: [DEFAULT_BRIDGE_URL] });

		dispatch(addSpendSources({
			id: NOSTR_PUB_DESTINATION,
			label: "Bootstrap Node",
			pasteField: newProfile,
			option: options.little,
			icon: "0",
			balance: "0",
			pubSource: true
		}));

	}, [])



	return null
}