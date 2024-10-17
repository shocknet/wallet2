import { useEffect } from "react";
import { useDispatch } from "../../State/store";

import { upgradeSourcesToNofferBridge } from "../../State/bridgeMiddleware";
const nofferedLnStorageKey = "noffer" // Has this wallet instance upgraded to new bridge

export const LnAddressCheck = () => {

	const dispatch = useDispatch();


	useEffect(() => {
		const nofferied = localStorage.getItem(nofferedLnStorageKey)
		if (nofferied) {
			return
		}
		dispatch(upgradeSourcesToNofferBridge())
		localStorage.setItem(nofferedLnStorageKey, "true")
	}, [dispatch]);

	return null;
}
