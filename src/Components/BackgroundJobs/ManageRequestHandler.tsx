import { useEffect } from "react";

import { getNostrClient, parseNprofile } from "../../Api/nostr";
import { selectNostrSpends, useDispatch, useSelector } from "../../State/store";

import { addManageRequest } from "../../State/Slices/modalsSlice";


export const ManageRequestHandler = () => {

	const nostrSpends = useSelector(selectNostrSpends);
	const nodedUp = useSelector(state => state.nostrPrivateKey);
	const dispatch = useDispatch();

	useEffect(() => {
		if (!nodedUp) {
			return;
		}
		nostrSpends.forEach(source => {
			const { pubkey, relays } = parseNprofile(source.pasteField)
			console.log("subscribing to manage requests for", pubkey)
			getNostrClient({ pubkey, relays }, source.keys).then(c => {
				c.GetLiveManageRequests(debitReq => {
					console.log("got request", debitReq)
					if (debitReq.status === "OK") {
						dispatch(addManageRequest({ request: debitReq, sourceId: source.id }))
					}
				})
			})
		});

	}, [nostrSpends, nodedUp, dispatch])

	return null
}