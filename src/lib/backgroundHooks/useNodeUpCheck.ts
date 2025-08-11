import { useEffect } from "react";
import { useDispatch, useSelector } from "@/State/store";
import { setPrivateKey } from "@/State/Slices/nostrPrivateKey";
import { useHistory } from "react-router";
import { fixSpendDuplicates } from "@/State/Slices/spendSourcesSlice";
import { fixPayDuplicates } from "@/State/Slices/paySourcesSlice";


export const useNodeUpCheck = () => {
	const history = useHistory()
	const dispatch = useDispatch();
	const paySource = useSelector((state) => state.paySource);
	const spendSource = useSelector(state => state.spendSource);
	const nodedUp = useSelector(state => state.nostrPrivateKey);

	useEffect(() => {
		if (!nodedUp && (paySource.order.length > 0 || spendSource.order.length > 0)) {
			dispatch(setPrivateKey());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paySource, spendSource])

	useEffect(() => {
		const routes = ["/nodeup", "/sources", "/auth", "/scan", "/metrics", "/stats"];
		if (!nodedUp && !routes.includes(history.location.pathname)) {
			history.push("/");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [history.location, nodedUp])


	useEffect(() => {
		dispatch(fixSpendDuplicates());
		dispatch(fixPayDuplicates());
	}, [dispatch])
}
