import { IonRouterOutlet } from "@ionic/react";
import {
	Redirect,
	Route,
	useHistory,
} from "react-router-dom";
import { lazy, memo, useEffect } from "react";
import { RuntimeIdentity } from "./types";
import { NavigationMenu } from "@/Components/NavigationMenu";
import { AppRoute } from "@/routing/AppRoute";
import { Layout } from "@/Layout";
import Swaps from '@/Pages/Swaps';
import { ReadyAppEffects } from "./ReadyAppEffects";
import AddNewIdentity from "@/Pages/AddNewIdentity";


const Home = lazy(() => import('@/Pages/Home'));
const Receive = lazy(() => import('@/Pages/Receive'));
const Send = lazy(() => import('@/Pages/Send'));

const SourcesPage = lazy(() => import("@/Pages/Sources"));
const IdentityOverviewPage = lazy(() => import("@/Pages/IdentityOverview"));



const Automation = lazy(() => import('@/Pages/Automation'));
const Prefs = lazy(() => import('@/Pages/Prefs'));
const Contacts = lazy(() => import('@/Pages/Contacts'));
const Invitations = lazy(() => import('@/Pages/Invitations'));
const Notify = lazy(() => import('@/Pages/Notify'));
const Metrics = lazy(() => import('@/Pages/Metrics'));
const LinkedApps = lazy(() => import('@/Pages/LinkedApps'));
const Offers = lazy(() => import('@/Pages/Offers'));
const Stats = lazy(() => import("@/Pages/Stats"));
const Management = lazy(() => import("@/Pages/Management"));
const AmountFieldPlayground = lazy(() => import("@/Pages/Dev/AmountFieldPlayground"));
const ClinkPlayground = lazy(() => import("@/Pages/Dev/ClinkPlayground"));





export const ReadyApp = memo(function ReadyApp({
	runtimeIdentity,
}: {
	runtimeIdentity: RuntimeIdentity;
}) {
	const history = useHistory();

	useEffect(() => {
		if (history.location.pathname === "/profile/create") {
			history.replace("/home");
		}
	}, [runtimeIdentity.pubkey, history]);

	return (
		<>
			<ReadyAppEffects />
			<NavigationMenu activeIdentity={runtimeIdentity} />
			<IonRouterOutlet id="main-content">
				<AppRoute
					exact
					path="/home"
					component={Home}
				/>
				<AppRoute
					exact
					path="/send"
					component={Send}
				/>
				<AppRoute
					exact
					path="/Receive"
					component={Receive}


				/>
				<AppRoute
					exact
					path="/sources"
					component={SourcesPage}
				/>
				<AppRoute
					exact
					path="/automation"
					component={Automation}

					layout={Layout}
				/>
				<AppRoute
					exact
					path="/prefs"
					component={Prefs}
				/>
				<AppRoute
					exact
					path="/contacts"
					component={Contacts}
					layout={Layout}
				/>
				<AppRoute
					exact
					path="/invitations"
					component={Invitations}
				/>
				<AppRoute
					exact
					path="/notify"
					component={Notify}
					layout={Layout}
				/>
				<AppRoute
					exact
					path="/management"
					component={Management}
					layout={Layout}
				/>
				<AppRoute
					path="/dashboard"
					component={Metrics}
				/>
				<Route
					path="/metrics"
					render={({ location }) => (
						<Redirect
							to={{
								pathname: location.pathname.replace(/^\/metrics(?=\/|$)/, "/dashboard"),
								search: location.search,
							}}
						/>
					)}
				/>
				<AppRoute
					exact
					path="/offers"
					component={Offers}
				/>
				<AppRoute
					exact
					path="/telemetry"
					component={Stats}
					layout={Layout}
				/>
				<Route exact path="/Stats">
					<Redirect to="/telemetry" />
				</Route>
				<AppRoute
					exact
					path="/LApps"
					component={LinkedApps}

				/>
				<AppRoute
					exact
					path="/swaps"
					component={Swaps}
				/>
				<AppRoute
					exact
					path="/profile"
					component={IdentityOverviewPage}
				/>
				<AppRoute
					exact
					path="/dev/amount-field"
					component={AmountFieldPlayground}
				/>
				<AppRoute
					exact
					path="/dev/clink"
					component={ClinkPlayground}
				/>
				<Route
					exact
					path="/profile/create"
					component={AddNewIdentity}
				/>
				<Route exact path="/">
					<Redirect to="/home" />
				</Route>
			</IonRouterOutlet>
		</>
	);
});
