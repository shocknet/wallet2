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
import { atLeastOneAdminNprofileSourceGuard, atLeastOneNprofileSource, atLeastOneSource } from "@/routing/guards";
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
const LinkedApp = lazy(() => import('@/Pages/LinkedApp'));
const Offers = lazy(() => import('@/Pages/Offers'));
const Stats = lazy(() => import("@/Pages/Stats"));
const Management = lazy(() => import("@/Pages/Management"));
const AmountFieldPlayground = import.meta.env.DEV
	? lazy(() => import("@/Pages/Dev/AmountFieldPlayground"))
	: null;
const ClinkPlayground = import.meta.env.DEV
	? lazy(() => import("@/Pages/Dev/ClinkPlayground"))
	: null;





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
					guards={[atLeastOneNprofileSource]}
				/>
				<GuardedRoute
					exact
					path="/Receive"
					component={Receive}

					guards={[atLeastOneSource]}
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
					component={LinkedApp}
					layout={Layout}
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
				{AmountFieldPlayground ? (
					<GuardedRoute
						exact
						path="/dev/amount-field"
						component={AmountFieldPlayground}
					/>
				) : null}
				{ClinkPlayground ? (
					<GuardedRoute
						exact
						path="/dev/clink"
						component={ClinkPlayground}
					/>
				) : null}
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




