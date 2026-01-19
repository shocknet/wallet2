import { useEffect } from "react";
import { IonPage, IonRouterOutlet, useIonViewWillEnter } from "@ionic/react";
import { Route, RouteComponentProps } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { selectAdminNprofileViews } from "@/State/scoped/backups/sources/selectors";
import { runtimeActions, selectSelectedMetricsAdminSourceId } from "@/State/runtime/slice";

import { GuardedRoute } from "@/routing/GuardedRoute";
import { requireSelectedAdminSourceGuard } from "@/routing/guards";

import MetricsSelectSource from "./MetricsSelectSource";
import Dashboard from "./metricsMain";
import Earnings from "./earnings";
import Routing from "./routing";
import Manage from "../Manage";
import Channels from "../Channels";
import AdminSwaps from "./AdminSwaps";

const Metrics = ({ match, location, history }: RouteComponentProps) => {


	const dispatch = useAppDispatch();
	const admins = useAppSelector(selectAdminNprofileViews);
	const selectedId = useAppSelector(selectSelectedMetricsAdminSourceId);

	// If selected source disappears (deleted etc), clear it.
	useEffect(() => {
		if (!selectedId) return;
		const stillExists = admins.some((a) => a.sourceId === selectedId);
		if (!stillExists) dispatch(runtimeActions.clearSelectedMetricsAdminSourceId());
	}, [admins, dispatch, selectedId]);

	useIonViewWillEnter(() => {
		// If we’re already on /metrics/select, don’t push again.
		if (location.pathname.startsWith("/metrics/select")) return;
		if (!selectedId) return;
		const sel = admins.find((a) => a.sourceId === selectedId);
		if (!sel) return;
		// Beacon is checked ONLY here (and on selection page).
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
				<GuardedRoute path={`${match.url}/swaps`} component={AdminSwaps} guards={[requireSelectedAdminSourceGuard]} />
			</IonRouterOutlet>
		</IonPage>
	);
};

export default Metrics;
