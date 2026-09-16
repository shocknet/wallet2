import { memo } from "react";
import { IonPage, IonRouterOutlet } from "@ionic/react";
import { Route, RouteComponentProps } from "react-router-dom";
import { useAppSelector } from "@/State/store/hooks";
import { selectAdminSourceIds } from "@/State/scoped/backups/sources/selectors";
import { selectSelectedMetricsAdminSourceId } from "@/State/runtime/slice";
import { SelectedAdminSourceProvider } from "./DashboardSourceContext";
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
import { shallowEqual } from "react-redux";

const Metrics = ({ match }: RouteComponentProps) => {
	const adminIds = useAppSelector(selectAdminSourceIds, shallowEqual);
	const selectedId = useAppSelector(selectSelectedMetricsAdminSourceId);
	const activeId = selectedId && adminIds.includes(selectedId)
		? selectedId
		: adminIds.length === 1
			? adminIds[0]
			: null;


	if (!activeId) {
		return <MetricsSelectSource />;
	}

	return (
		<SelectedAdminSourceProvider sourceId={activeId}>
			<MetricsPages sourceId={activeId} url={match.url} />
		</SelectedAdminSourceProvider>
	);
};

const MetricsPages = memo(function MetricsPages({
	sourceId,
	url,
}: {
	sourceId: string;
	url: string;
}) {
	return (
		<IonPage>
			<IonRouterOutlet key={`metrics-subtree:${sourceId}`}>
				<Route exact path={url} component={Dashboard} />
				<Route path={`${url}/earnings`} component={Earnings} />
				<Route path={`${url}/routing`} component={Routing} />
				<Route path={`${url}/manage`} component={Manage} />
				<Route path={`${url}/channels`} component={Channels} />
				<Route path={`${url}/peers`} component={Peers} />
				<Route path={`${url}/swaps`} component={AdminSwaps} />
				<Route path={`${url}/assets-liabilities`} component={AssetsAndLiab} />
				<Route exact path={`${url}/users`} component={UsersAdmin} />
				<Route path={`${url}/users/:userId`} component={UserOperationsAdmin} />
			</IonRouterOutlet>
		</IonPage>
	);
});

export default Metrics;
