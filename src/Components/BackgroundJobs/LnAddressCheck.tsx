import { useEffect } from "react";
import { useDispatch } from "../../State/store";

import { upgradeSourcesToNofferBridge } from "../../State/bridgeMiddleware";

export const LnAddressCheck = () => {

	const dispatch = useDispatch();


	useEffect(() => {
		dispatch(upgradeSourcesToNofferBridge())
	}, [dispatch]);

	return null;
}
