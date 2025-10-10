import './App.scss';
import "react-toastify/dist/ReactToastify.css";
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import "./theme/variables.css";

import { Redirect, Route, RouteProps, useLocation } from "react-router-dom";
import React, { lazy, ReactNode, Suspense, useEffect, useState } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import ErrorBoundary from "./Hooks/ErrorBoundary";
import store, { persistor, useSelector } from './State/store/store';
import { Provider } from 'react-redux';
import { ToastContainer } from "react-toastify";
import LoadingOverlay from "./Components/LoadingOverlay";
import NavigationMenu from "./Components/NavigationMenu";
import { AlertProvider } from "./lib/contexts/useAlert";
import { ToastProvider } from "./lib/contexts/useToast";
import nostrSvg from "../icons/nostr.svg"
import { addIcons } from "ionicons";
import FullSpinner from "./Components/common/ui/fullSpinner";
import { ScannerProvider } from "./lib/contexts/pwaScannerProvider";
import { useAppUrlListener } from './Hooks/appUrlListener';
import { cleanupStaleServiceWorkers } from './sw-cleanup';
import { selectActiveIdentityId } from './State/identitiesRegistry/slice';
import { useAppSelector } from './State/store/hooks';
import { migrateDeviceToIdentities } from './State/identitiesRegistry/identitiesMigration';
import { PersistGate } from 'redux-persist/integration/react';
import { LAST_ACTIVE_IDENTITY_PUBKEY_KEY, switchIdentity } from './State/identitiesRegistry/thunks';
import { selectHealthyNprofileViews } from './State/scoped/backups/sources/selectors';
import { Layout } from './Layout';

import CreateIdentityPage from './Pages/CreateIdentity';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';


import { NavigationBar } from "@capgo/capacitor-navigation-bar";
import { StatusBar, Style } from "@capacitor/status-bar";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from './constants';

async function setEnvColors() {
	await NavigationBar.setNavigationBarColor({ color: '#16191c' });
	await StatusBar.setOverlaysWebView({ overlay: false });
	await StatusBar.setStyle({ style: Style.Dark });
	await StatusBar.setBackgroundColor({ color: "#16191c" });
	await EdgeToEdge.setBackgroundColor({ color: "#16191c" });
}
setEnvColors();

const Home = lazy(() => import('./Pages/Home'));
const Receive = lazy(() => import('./Pages/Receive'));
const Send = lazy(() => import('./Pages/Send'));

const CreateKeysIdentityPage = lazy(() => import("./Pages/CreateIdentity/CreateKeysIdentity"));
const CreateSanctumIdentityPage = lazy(() => import("./Pages/CreateIdentity/CreateSanctumIdentityPage"));
const BootstrapSourcePage = lazy(() => import("./Pages/CreateIdentity/BootstrapSource"));
const IdentityOverviewPage = lazy(() => import("./Pages/CreateIdentity/IdentityOverview"));
const SourcesPage = lazy(() => import("./Pages/Sources"));
const IdentitiesPage = lazy(() => import("./Pages/CreateIdentity/Identities"));


const Automation = lazy(() => import('./Pages/Automation'));
const Prefs = lazy(() => import('./Pages/Prefs'));
const Contacts = lazy(() => import('./Pages/Contacts'));
const Invitations = lazy(() => import('./Pages/Invitations'));
const Notify = lazy(() => import('./Pages/Notify'));
const Metrics = lazy(() => import('./Pages/Metrics'));
const LinkedApp = lazy(() => import('./Pages/LinkedApp'));
const Offers = lazy(() => import('./Pages/Offers'));
const Stats = lazy(() => import("./Pages/Stats"));
const Earnings = lazy(() => import("./Pages/Metrics/earnings"));
const Routing = lazy(() => import("./Pages/Metrics/routing"));
const Management = lazy(() => import("./Pages/Management"));


const BackgroundJobs = lazy(() => import("@/lib/backgroundHooks")); // Background jobs
const ManageRequestsModal = lazy(() => import("@/Components/Modals/ManageRequestModal"));
const DebitRequestModal = lazy(() => import("@/Components/Modals/DebitRequestModal").then(mod => ({ default: mod.DebitRequestModal })));
const EditDebitModal = lazy(() => import("@/Components/Modals/DebitRequestModal").then(mod => ({ default: mod.EditDebitModal })));

addIcons({
	nostr: nostrSvg,
})
setupIonicReact();
document.documentElement.classList.add('dark');



const AppJobs = () => {
	useAppUrlListener();

	const manageRequests = useSelector(state => state.modalsSlice.manageRequests);
	const debitRequests = useSelector(state => state.modalsSlice.debitRequests);
	const debitToEdit = useSelector(state => state.modalsSlice.editDebit);
	const activeIdentityId = useSelector(selectActiveIdentityId);

	useEffect(() => {
		cleanupStaleServiceWorkers()
	}, []);


	/*
	* Defer loading in the background jobs until browser decides main thread is idle
	*/
	const [loadBackgroundJobs, setLoadBackgroundJobs] = useState(false);
	useEffect(() => {
		// Prefer requestIdleCallback; fall back to a small timeout
		const id = ('requestIdleCallback' in window)
			? requestIdleCallback(
				() => {
					setLoadBackgroundJobs(true)
				},
				{ timeout: 3000 }
			)
			: setTimeout(() => setLoadBackgroundJobs(true), 1500);

		return () => {
			if ('cancelIdleCallback' in window)
				cancelIdleCallback(id as number);
			else
				clearTimeout(id);
		};
	}, []);

	return (
		<>
			{
				(
					loadBackgroundJobs
					&&
					activeIdentityId
				)
				&&
				<Suspense fallback={null}>
					<BackgroundJobs />
				</Suspense>
			}
			<LoadingOverlay />

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

const AppContent: React.FC = () => {





	return (
		<IonReactRouter>
			<AppJobs />
			<NavigationMenu />
			<IonRouterOutlet id="main-content" >
				<Route
					exact
					path="/identities"
				>
					<Suspense fallback={<FullSpinner />}>
						<IdentitiesPage />
					</Suspense>
				</Route>



				<Route
					exact
					path="/identity/create"
				>
					<CreateIdentityPage />
				</Route>


				<Route
					exact
					path="/identity/create/keys"
					render={(props) =>
						<Suspense fallback={<FullSpinner />}>
							<CreateKeysIdentityPage {...props} />
						</Suspense>
					}
				/>
				<Route
					exact
					path="/identity/create/sanctum"
					render={(props) =>
						<Suspense fallback={<FullSpinner />}>
							<CreateSanctumIdentityPage {...props} />
						</Suspense>
					}
				/>

				<IdentityRouteGate
					exact
					path="/identity/bootstrap"
				>
					<Suspense fallback={<FullSpinner />}>
						<BootstrapSourcePage />
					</Suspense>
				</IdentityRouteGate>


				<IdentityRouteGate
					exact
					path="/identity/overview"
				>
					<Suspense fallback={<FullSpinner />}>
						<IdentityOverviewPage />
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/home"
				>
					<Suspense fallback={<FullSpinner />}>
						<Home />
					</Suspense>
				</IdentityRouteGate>





				<IdentityRouteGate
					exact
					path="/sources"
				>
					<Suspense fallback={<FullSpinner />}>
						<SourcesPage />
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/receive"

				>
					<Suspense fallback={<FullSpinner />}>
						<Receive />
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/send"
				>
					<AtLeastOneHealthyNprofileSourceRouteGate>
						<Suspense fallback={<FullSpinner />}>
							<Send />
						</Suspense>
					</AtLeastOneHealthyNprofileSourceRouteGate>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/automation"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Automation />
						</Layout>
					</Suspense>
				</IdentityRouteGate>
				<IdentityRouteGate
					exact
					path="/prefs"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Prefs />
						</Layout>
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/contacts"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Contacts />
						</Layout>
					</Suspense>
				</IdentityRouteGate>
				<IdentityRouteGate
					exact
					path="/invitations"

				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Invitations />
						</Layout>
					</Suspense>
				</IdentityRouteGate>
				<IdentityRouteGate
					exact
					path="/notify"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Notify />
						</Layout>
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/metrics"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Metrics />
						</Layout>
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/metrics/earnings"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Earnings />
						</Layout>
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/metrics/routing"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Routing />
						</Layout>
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/LApps"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<LinkedApp />
						</Layout>
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/management"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Management />
						</Layout>
					</Suspense>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/Offers"
				>
					<AtLeastOneHealthyNprofileSourceRouteGate>
						<Suspense fallback={<FullSpinner />}>
							<Offers />
						</Suspense>
					</AtLeastOneHealthyNprofileSourceRouteGate>
				</IdentityRouteGate>

				<IdentityRouteGate
					exact
					path="/Stats"
				>
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Stats />
						</Layout>
					</Suspense>
				</IdentityRouteGate>
				<Route exact path="/" >
					<Redirect to="/home" />
				</Route>
			</IonRouterOutlet >
		</IonReactRouter>
	);
};



const IdentityRouteGate = ({ children, ...rest }: RouteProps & { children: ReactNode }) => {
	return (
		<Route
			{...rest}
			render={() => <InnerGate>{children}</InnerGate>}
		/>
	);
}

const InnerGate = ({ children }: { children: ReactNode }) => {
	const isBoostrapped = useAppSelector(state => state.appState.bootstrapped);
	const activeIdentity = useAppSelector(selectActiveIdentityId, (prev, next) => prev === next);
	const ready = isBoostrapped && activeIdentity;
	const location = useLocation()


	if (ready) {
		return children;
	}
	return (
		<Redirect
			to={{
				pathname: "/identity/create",
				state: { from: location }
			}}
		/>
	);
}


const AtLeastOneHealthyNprofileSourceRouteGate = ({ children }: { children: ReactNode }) => {
	const location = useLocation();
	const healthyNprofileViews = useAppSelector(selectHealthyNprofileViews, (prev, next) => prev.length === next.length);

	if (healthyNprofileViews.length === 0) {
		return <Redirect
			to={{
				pathname: "/home",
				state: { from: location.pathname, reason: "noSources" }
			}}
		/>
	}
	return children;
}




const App: React.FC = () => {


	return (
		<ErrorBoundary>
			<Provider store={store}>
				<PersistGate
					onBeforeLift={async () => {
						const exists = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
						console.log({ exists })
						if (exists) {
							await store.dispatch(migrateDeviceToIdentities());
							return;
						}

						const pubkey = localStorage.getItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);


						if (pubkey) {
							try {
								await store.dispatch(switchIdentity(pubkey, true))
							} catch {
								localStorage.removeItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);
								window.location.reload();
								await new Promise(() => {/*  */ })
							}
						}
					}}
					persistor={persistor}
					loading={<FullSpinner />}
				>
					<IonApp>
						<ScannerProvider>
							<AlertProvider>
								<ToastProvider>
									<AppContent />

								</ToastProvider>
							</AlertProvider>
						</ScannerProvider>
					</IonApp>
				</PersistGate>
			</Provider>
			<ToastContainer
				theme="colored"
				position="top-center"
				closeOnClick
				pauseOnHover
				autoClose={4000}
				limit={2}
				pauseOnFocusLoss={false}
			/>
		</ErrorBoundary>
	);
};

export default App;
