import { useEffect } from "react";
import { useSelector } from "../../State/store";
import { NODED_UP_STORAGE_KEY } from "../../constants";


export const NodeUpCheck = () => {
	const paySource = useSelector((state) => state.paySource);
	const spendSource = useSelector(state => state.spendSource);
	const nodedUp = localStorage.getItem(NODED_UP_STORAGE_KEY);

	useEffect(() => {
		if (!nodedUp && (paySource.order.length > 0 || spendSource.order.length > 0)) {
			localStorage.setItem(NODED_UP_STORAGE_KEY, "true");
		}
	}, [nodedUp, paySource, spendSource])

	return null;
}
