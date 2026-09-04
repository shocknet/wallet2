import { useEffect } from "react";
import { IonPage, IonRouterOutlet, useIonViewWillEnter } from "@ionic/react";
import { Route, RouteComponentProps } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	selectAdminRpcSources,
	selectAdminSourceViews,
} from "@/State/scoped/backups/sources/selectors";
import { runtimeActions, selectSelectedMetricsAdminSourceId } from "@/State/runtime/slice";
import store from "@/State/store/store";

import { GuardedRoute } from "@/routing/GuardedRoute";
import { requireSelectedAdminSourceGuard } from "@/routing/guards";

import MetricsSelectSource from "./MetricsSelectSource";
import Dashboard from "./metricsMain";
import Earnings from "./earnings";
import Routing from "./routing";
import Manage from "../Manage";
import Channels from "../Channels";
import Peers from "./Peers";
import AdminSwaps from "./adminSwaps/AdminSwaps";
import { AssetsAndLiab } from "./AssetsAndLiab";
import UsersAdmin from "./UsersAdmin";
import UserOperationsAdmin from "./UserOperationsAdmin";

const Metrics = ({ match, location, history }: RouteComponentProps) => {
	const dispatch = useAppDispatch();
	const adminIds = useAppSelector(selectAdminRpcSources);
	const selectedId = useAppSelector(selectSelectedMetricsAdminSourceId);

	useEffect(() => {
		if (!selectedId) return;
		const stillExists = adminIds.some((a) => a.sourceId === selectedId);
		if (!stillExists) dispatch(runtimeActions.clearSelectedMetricsAdminSourceId());
	}, [adminIds, dispatch, selectedId]);

	useIonViewWillEnter(() => {
		const state = store.getState();
		const currentId = selectSelectedMetricsAdminSourceId(state);
		if (location.pathname.startsWith("/metrics/select")) return;
		if (!currentId) return;
		const sel = selectAdminSourceViews(state).find((a) => a.sourceId === currentId);
		if (!sel) return;
		if (sel.beaconStale === "warmingUp" || sel.beaconStale === "stale") {
			history.replace("/metrics/select", { from: location });
		}
	});

	return (
		<IonPage>
			<IonRouterOutlet key={`metrics-subtree:${selectedId ?? "none"}`}>
				<Route exact path={`${match.url}/select`} component={MetricsSelectSource} />

				<GuardedRoute exact path={match.url} component={Dashboard} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute path={`${match.url}/earnings`} component={Earnings} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute path={`${match.url}/routing`} component={Routing} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute path={`${match.url}/manage`} component={Manage} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute path={`${match.url}/channels`} component={Channels} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute path={`${match.url}/peers`} component={Peers} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute path={`${match.url}/swaps`} component={AdminSwaps} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute path={`${match.url}/assets-liabilities`} component={AssetsAndLiab} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute exact path={`${match.url}/users`} component={UsersAdmin} guards={[requireSelectedAdminSourceGuard]} />
				<GuardedRoute path={`${match.url}/users/:userId`} component={UserOperationsAdmin} guards={[requireSelectedAdminSourceGuard]} />
			</IonRouterOutlet>
		</IonPage>
	);
};

export default Metrics;
