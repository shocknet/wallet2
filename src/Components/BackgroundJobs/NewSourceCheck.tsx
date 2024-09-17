import { useEffect } from "react"
import { useDispatch, useSelector } from "../../State/store"
import {  NOSTR_PUB_DESTINATION, NOSTR_RELAYS, OLD_NOSTR_PUB_DESTINATION, options } from "../../constants"
import { addSpendSources } from "../../State/Slices/spendSourcesSlice"
import { nip19 } from "nostr-tools";

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
		const newProfile = nip19.nprofileEncode({ pubkey: NOSTR_PUB_DESTINATION, relays: NOSTR_RELAYS });

		dispatch(addSpendSources({
			source: {
				id: NOSTR_PUB_DESTINATION,
				label: "Bootstrap Node",
				pasteField: newProfile,
				option: options.little,
				icon: "0",
				balance: "0",
				pubSource: true
			}
		}));

	}, [])



	return null
}