import { useEffect } from "react";
import { getNostrClient } from "@/Api/nostr";
import { useDispatch } from "@/State/store/store";
import { addDebitRequest } from "@/State/Slices/modalsSlice";
import { useAppSelector } from "@/State/store/hooks";
import { selectHealthyNprofileViews } from "@/State/scoped/backups/sources/selectors";







export const useDebitRequestHandler = () => {

	const healthyNprofileSourceViews = useAppSelector(selectHealthyNprofileViews);
	const nodedUp = useAppSelector(state => state.appState.bootstrapped);
	const dispatch = useDispatch();

	useEffect(() => {
		if (!nodedUp) {
			return;
		}
		healthyNprofileSourceViews.forEach(source => {

			getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys).then(c => {
				c.GetLiveDebitRequests(debitReq => {
					console.log("got request")
					if (debitReq.status === "OK") {

						dispatch(addDebitRequest({ request: debitReq, sourceId: source.sourceId }))
					}
				})
			})
		});

	}, [healthyNprofileSourceViews, nodedUp, dispatch])
}
