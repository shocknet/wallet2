import { useEffect } from "react";

import { getNostrClient } from "@/Api/nostr";
import { selectNostrSpends, useDispatch, useSelector } from "@/State/store";

import { addDebitRequest } from "@/State/Slices/modalsSlice";
import { parseNprofile } from "../nprofile";







export const useDebitRequestHandler = () => {

	const nostrSpends = useSelector(selectNostrSpends);
	const nodedUp = useSelector(state => state.nostrPrivateKey);
	const dispatch = useDispatch();

	useEffect(() => {
		if (!nodedUp) {
			return;
		}
		nostrSpends.forEach(source => {
			const { pubkey, relays } = parseNprofile(source.pasteField)
			getNostrClient({ pubkey, relays }, source.keys).then(c => {
				c.GetLiveDebitRequests(debitReq => {
					console.log("got request")
					if (debitReq.status === "OK") {

						dispatch(addDebitRequest({ request: debitReq, sourceId: source.id }))
					}
				})
			})
		});

	}, [nostrSpends, nodedUp, dispatch])
}
