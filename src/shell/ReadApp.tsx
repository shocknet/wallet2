import {
	IonRouterOutlet,
} from "@ionic/react";
import {
	Redirect,
	Route,
} from "react-router-dom";
import { lazy } from "react";
import { RuntimeIdentity } from "./types";
import { NavigationMenu } from "@/Components/NavigationMenu";
import { GuardedRoute } from "@/routing/GuardedRoute";
import { atLeastOneAdminNprofileSourceGuard, atLeastOneNprofileSource } from "@/routing/guards";
import { Layout } from "@/Layout";
import Swaps from '@/Pages/Swaps';
import { ReadyAppEffects } from "./ReadyAppEffects";
import AddNewIdentity from "@/Pages/AddNewIdentity";
import AuthRequestsHost from "@/Components/Modals/AuthRequestsHost";


const Home = lazy(() => import('@/Pages/Home'));
const Receive = lazy(() => import('@/Pages/Receive'));
const Send = lazy(() => import('@/Pages/Send'));

const SourcesPage = lazy(() => import("@/Pages/Sources"));
const BootstrapSourcePage = lazy(() => import("@/Pages/BootstrapSource"));
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





export function ReadyApp({
	runtimeIdentity,
}: {
	runtimeIdentity: RuntimeIdentity;
}) {

	return (
		<>
			<AuthRequestsHost />
			<ReadyAppEffects />
			<NavigationMenu activeIdentity={runtimeIdentity} />
			<IonRouterOutlet id="main-content">
				<GuardedRoute
					exact
					path="/bootstrap"
					component={BootstrapSourcePage}
				/>
				<GuardedRoute
					exact
					path="/home"
					component={Home}
				/>
				<GuardedRoute
					exact
					path="/send"
					component={Send}
				/>
				<GuardedRoute
					exact
					path="/Receive"
					component={Receive}


				/>
				<GuardedRoute
					exact
					path="/sources"
					component={SourcesPage}
				/>
				<GuardedRoute
					exact
					path="/automation"
					component={Automation}

					layout={Layout}
				/>
				<GuardedRoute
					exact
					path="/prefs"
					component={Prefs}
				/>
				<GuardedRoute
					exact
					path="/contacts"
					component={Contacts}
					layout={Layout}
				/>
				<GuardedRoute
					exact
					path="/invitations"
					component={Invitations}
					layout={Layout}
				/>
				<GuardedRoute
					exact
					path="/notify"
					component={Notify}
					layout={Layout}
				/>
				<GuardedRoute
					exact
					path="/management"
					component={Management}
					layout={Layout}
				/>
				<GuardedRoute
					path="/metrics"
					component={Metrics}
					guards={[atLeastOneAdminNprofileSourceGuard]}
				/>
				<GuardedRoute
					exact
					path="/offers"
					component={Offers}
					guards={[atLeastOneNprofileSource]}
				/>
				<GuardedRoute
					exact
					path="/Stats"
					component={Stats}
					layout={Layout}
				/>
				<GuardedRoute
					exact
					path="/LApps"
					component={LinkedApps}

				/>
				<GuardedRoute
					exact
					path="/swaps"
					component={Swaps}
					guards={[atLeastOneNprofileSource]}
				/>
				<GuardedRoute
					exact
					path="/profile"
					component={IdentityOverviewPage}
				/>
				<GuardedRoute
					exact
					path="/dev/amount-field"
					component={AmountFieldPlayground}
				/>
				<GuardedRoute
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
}




