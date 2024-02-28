import { useEffect, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "../../State/store";
import { setPrivateKey } from "../../State/Slices/nostrPrivateKey";
import { useHistory } from "react-router";


export const NodeUpCheck = () => {
	const history = useHistory()
	const dispatch = useDispatch();
	const paySource = useSelector((state) => state.paySource);
	const spendSource = useSelector(state => state.spendSource);
	const nodedUp = useSelector(state => state.nostrPrivateKey);

	useEffect(() => {
		if (!nodedUp && (paySource.order.length > 0 || spendSource.order.length > 0)) {
			dispatch(setPrivateKey());
		}
	}, [paySource, spendSource])

	useLayoutEffect(() => {
		const routes = ["/", "/sources", "/auth"];
		if (!nodedUp && !routes.includes(history.location.pathname)) {
			history.push("/");
		}
	}, [history.location, nodedUp])

	return null;
}
