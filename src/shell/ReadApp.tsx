import {
	IonRouterOutlet,
	useIonRouter,
} from "@ionic/react";
import {
	Redirect,
	Route,
	useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import {
	selectPendingNav,
} from "./selectors";
import {
	useAppDispatch,
	useAppSelector,
} from "@/State/store/hooks";
import { shellActions } from "./slice";
import {
	pendingNavReadyForIdentity,
} from "./pendingNav";
import { RuntimeIdentity } from "./types";
import { NavigationMenu } from "@/Components/NavigationMenu";
import { IdentityGate } from "./screens/identityGate";
import { GuardedRoute } from "@/routing/GuardedRoute";
import { atLeastOneAdminNprofileSourceGuard, atLeastOneNprofileSource, atLeastOneSource } from "@/routing/guards";
import { Layout } from "@/Layout";
import Swaps from '@/Pages/Swaps';
import { useWatchClipboard } from "@/Hooks/useWatchClipboard";
import { cleanupStaleServiceWorkers } from "@/sw-cleanup";
import FullSpinner from "@/Components/common/ui/fullSpinner";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";


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



const ManageRequestsModal = lazy(() => import("@/Components/Modals/ManageRequestModal"));
const DebitRequestModal = lazy(() => import("@/Components/Modals/DebitRequestModal").then(mod => ({ default: mod.DebitRequestModal })));
const EditDebitModal = lazy(() => import("@/Components/Modals/DebitRequestModal").then(mod => ({ default: mod.EditDebitModal })));

const CHROME_HIDDEN_PATHS = new Set([
	"/bootstrap",
	"/profile/create",
]);

export function ReadyApp({
	runtimeIdentity,
}: {
	runtimeIdentity: RuntimeIdentity;
}) {
	useWatchClipboard();

	const location = useLocation();
	const showChrome = !CHROME_HIDDEN_PATHS.has(location.pathname);

	return (
		<>
			<ReactiveModals />
			{showChrome ? (
				<NavigationMenu activeIdentity={runtimeIdentity} />
			) : null}

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
				<Route
					exact
					path="/profile/create"
					component={IdentityGate}
				/>

				<Route exact path="/">
					<Redirect to="/home" />
				</Route>
			</IonRouterOutlet>

			<PendingNavConsumer />
		</>
	);
}

function PendingNavConsumer() {
	const router = useIonRouter();
	const dispatch = useAppDispatch();
	const pendingNav = useAppSelector(selectPendingNav);
	const readyIdentityId = useAppSelector(selectActiveIdentity)?.pubkey ?? null;

	useEffect(() => {
		if (
			!pendingNav ||
			!pendingNavReadyForIdentity(
				pendingNav,
				readyIdentityId,
			)
		) {
			return;
		}

		router.push(
			pendingNav.path,
			"root",
			pendingNav.path === "/bootstrap" ? "replace" : "push",
			pendingNav.state as Record<string, unknown> | undefined,
		);

		dispatch(shellActions.pendingNavCleared());
	}, [pendingNav, readyIdentityId, router, dispatch]);

	return null;
}


const ReactiveModals = () => {
	const manageRequests = useAppSelector(state => state.modalsSlice.manageRequests);
	const debitRequests = useAppSelector(state => state.modalsSlice.debitRequests);
	const debitToEdit = useAppSelector(state => state.modalsSlice.editDebit);

	useEffect(() => {
		cleanupStaleServiceWorkers();
	}, []);

	return (
		<>
			{/* Modals */}
			{
				(manageRequests && manageRequests.length > 0)
				&&
				<Suspense fallback={<FullSpinner />}>
					<ManageRequestsModal />
				</Suspense>
			}
			{
				(debitRequests && debitRequests.length > 0)
				&&
				<Suspense fallback={<FullSpinner />}>
					<DebitRequestModal />
				</Suspense>
			}
			{
				debitToEdit
				&&
				<Suspense fallback={<FullSpinner />}>
					<EditDebitModal />
				</Suspense>
			}
		</>
	)
}
