import { useEffect } from "react";
import { useDispatch } from "@/State/store";

import { upgradeSourcesToNofferBridge } from "@/State/bridgeMiddleware";
import { addNdebitDiscoverableListener, ndebitDiscoverableListener, useNdebitDiscoverableDipstach } from "@/State/ndebitDiscoverableMiddleware";

export const useLnAddressCheck = () => {
	const dispatchNdebitDiscoverable = useNdebitDiscoverableDipstach();
	const dispatch = useDispatch();


	useEffect(() => {
		dispatchNdebitDiscoverable(addNdebitDiscoverableListener(ndebitDiscoverableListener))
		dispatch(upgradeSourcesToNofferBridge());
	}, [dispatch, dispatchNdebitDiscoverable]);

}
