import { useEffect } from "react";
import { getNostrClient } from "@/Api/nostr";
import { useDispatch, useSelector } from "@/State/store/store";
import { addManageRequest } from "@/State/Slices/modalsSlice";
import { useAppSelector } from "@/State/store/hooks";
import { selectHealthyNprofileViews } from "@/State/scoped/backups/sources/selectors";


export const useManageRequestHandler = () => {

	const healthyNprofileSourceViews = useAppSelector(selectHealthyNprofileViews);
	const nodedUp = useSelector(state => state.appState.bootstrapped);
	const dispatch = useDispatch();

	useEffect(() => {
		if (!nodedUp) {
			return;
		}
		healthyNprofileSourceViews.forEach(source => {

			console.log("subscribing to manage requests for", source.lpk)
			getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys).then(c => {
				c.GetLiveManageRequests(debitReq => {
					console.log("got request", debitReq)
					if (debitReq.status === "OK") {
						dispatch(addManageRequest({ request: debitReq, sourceId: source.sourceId }))
					}
				})
			})
		});

	}, [healthyNprofileSourceViews, nodedUp, dispatch])
}
