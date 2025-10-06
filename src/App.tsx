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

import { Redirect, Route, useLocation, } from "react-router-dom";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import ErrorBoundary from "./Hooks/ErrorBoundary";
import store, { persistor, useSelector } from './State/store/store';
import { StatusBar } from "@capacitor/status-bar";
import { Provider } from 'react-redux';
import { ToastContainer } from "react-toastify";
import LoadingOverlay from "./Components/LoadingOverlay";
import NavigationMenu from "./Components/NavigationMenu";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from "./constants";
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
import { migrateDeviceToIdentities, OLD_BACKUP_STATE_STORAGE_KEY } from './State/identitiesRegistry/identitiesMigration';
import { PersistGate } from 'redux-persist/integration/react';
import { LAST_ACTIVE_IDENTITY_PUBKEY_KEY, switchIdentity } from './State/identitiesRegistry/thunks';
import { SourceType } from './State/scoped/common';
import { NprofileView, selectFavoriteSourceView, selectHealthyNprofileViews } from './State/scoped/backups/sources/selectors';





const Home = lazy(() => import('./Pages/Home'));
const Receive = lazy(() => import('./Pages/Receive'));
const Send = lazy(() => import('./Pages/Send'));
const CreateIdentityPage = lazy(() => import("./Pages/CreateIdentity/index"));
const CreateKeysIdentityPage = lazy(() => import("./Pages/CreateIdentity/CreateKeysIdentity"));
const CreateSanctumIdentityPage = lazy(() => import("./Pages/CreateIdentity/CreateSanctumIdentityPage"));
const IdentityOverviewPage = lazy(() => import("./Pages/CreateIdentity/IdentityOverview"));
const IdentitiesPage = lazy(() => import("./Pages/Identities"));
const SourcesPage = lazy(() => import("./Pages/Sources"));

/* const NodeUp = lazy(() => import('./Pages/NodeUp'));
const Loader = lazy(() => import('./Pages/Loader'));
const Sources = lazy(() => import('./Pages/Sources'));
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
const Management = lazy(() => import("./Pages/Management")); */


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
				loadBackgroundJobs
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
	const activeIdentityPubkey = useAppSelector(selectActiveIdentityId);


	return (
		<>
			<NavigationMenu />
			<IonRouterOutlet id="main-content" animated={true} key={activeIdentityPubkey || "none"}>
				<Redirect exact from="/" to="/home" />

				<Route
					exact
					path="/identity/create"
					render={(props) =>
						<Suspense fallback={<FullSpinner />}>
							<CreateIdentityPage {...props} />
						</Suspense>
					}
				/>
				<Route
					path="/identity/create/keys"
					render={(props) =>
						<Suspense fallback={<FullSpinner />}>
							<CreateKeysIdentityPage {...props} />
						</Suspense>
					}
				/>
				<Route
					path="/identity/create/sanctum"
					render={(props) =>
						<Suspense fallback={<FullSpinner />}>
							<CreateSanctumIdentityPage {...props} />
						</Suspense>
					}
				/>
				<Route
					path="/identity/overview"
					render={(props) =>
						<NodeupGate>
							<IdentityGate>
								<Suspense fallback={<FullSpinner />}>
									<IdentityOverviewPage {...props} />
								</Suspense>
							</IdentityGate>
						</NodeupGate>
					}
				/>
				<Route
					path="/identities"
					render={(props) =>
						<NodeupGate>
							<Suspense fallback={<FullSpinner />}>
								<IdentitiesPage {...props} />
							</Suspense>
						</NodeupGate>
					}
				/>

				<Route
					exact
					path="/home"
					render={(props) =>
						<NodeupGate>
							<IdentityGate>
								<Suspense fallback={<FullSpinner />}>
									<Home {...props} />
								</Suspense>
							</IdentityGate>
						</NodeupGate>
					}
				/>

				<Route
					exact
					path="/sources"
					render={(props) =>
						<NodeupGate>
							<IdentityGate>
								<Suspense fallback={<FullSpinner />}>
									<SourcesPage {...props} />
								</Suspense>
							</IdentityGate>
						</NodeupGate>
					}
				/>

				<Route
					exact
					path="/receive"
					render={(props) =>
						<NodeupGate>
							<IdentityGate>
								<Suspense fallback={<FullSpinner />}>
									<Receive {...props} />
								</Suspense>
							</IdentityGate>
						</NodeupGate>
					}
				/>

				<Route
					exact
					path="/send"
					render={(props) =>
						<NodeupGate>
							<IdentityGate>
								<SpendSourceGate>
									{(source) => (
										<Suspense fallback={<FullSpinner />}>
											<Send {...props} initialSource={source} />
										</Suspense>
									)}
								</SpendSourceGate>
							</IdentityGate>
						</NodeupGate>
					}
				/>


				{/* 				<Route exact path="/loader">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Loader />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/send" render={(props) =>
					<Suspense fallback={<FullSpinner />}>
						<Send {...props} />
					</Suspense>
				}
				/> */}
				{/* <Route path="/sources">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Sources />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/automation">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Automation />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/prefs">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Prefs />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/contacts">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Contacts />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/invitations">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Invitations />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/auth">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Auth />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/notify">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Notify />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/metrics">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Metrics />
						</Layout>
					</Suspense>

				</Route> */}
				{/* <Route exact path="/metrics/earnings">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Earnings />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/metrics/routing">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Routing />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/LApps">

					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<LinkedApp />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/management">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Management />
						</Layout>
					</Suspense>
				</Route> */}
				{/* <Route exact path="/Offers">
					<Suspense fallback={<FullSpinner />}>
						<Offers />
					</Suspense>
				</Route> */}
				{/* <Route exact path="/Stats">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Stats />
						</Layout>
					</Suspense>
				</Route> */}
				<Route render={() => <Redirect to="/home" />} />
			</IonRouterOutlet >
		</>
	);
};





interface GateProps {
	children: React.ReactNode;
}

const NodeupGate = ({ children }: GateProps) => {
	const isBoostrapped = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);

	if (!isBoostrapped) return <Redirect to="/identity/create" />

	return children;
};

const IdentityGate = ({ children }: GateProps) => {
	const activeIdentity = useAppSelector(selectActiveIdentityId);

	if (!activeIdentity) return <Redirect to="/identities" />

	return children;
};



type SpendChild = (source: NprofileView) => React.ReactNode;
const spendable = (s: NprofileView) => Number(s.maxWithdrawableSats ?? 0);

const SpendSourceGate: React.FC<{ children: SpendChild }> = ({ children }) => {
	const loc = useLocation();
	const favorite = useAppSelector(selectFavoriteSourceView)!;
	const all = useAppSelector(selectHealthyNprofileViews);



	const preferred = useMemo<NprofileView | null>(() => {
		// 1) Prefer favorite if it’s an nprofile, not stale, and has spendable balance
		if (
			favorite &&
			favorite.type === SourceType.NPROFILE_SOURCE &&
			!favorite.beaconStale &&
			spendable(favorite) > 0
		) {
			return favorite;
		}

		if (all.length === 0) return null;
		// 2) Otherwise, choose the source with the highest spendable balance
		return all.reduce((best, s) => (spendable(s) > spendable(best) ? s : best), all[0]);
	}, [favorite, all]);



	if (all.length === 0) {
		console.log("REDIRECTING NOW")
		return <Redirect
			to={{
				pathname: "/home",
				state: { from: loc.pathname, reason: "noSources" }
			}}
		/>
	}


	return <>{children(preferred!)}</>;
};





const App: React.FC = () => {
	useEffect(() => {
		StatusBar.setOverlaysWebView({ overlay: false });
		StatusBar.setBackgroundColor({ color: "#16191c" })
	}, []);


	return (
		<Provider store={store}>
			<PersistGate
				onBeforeLift={async () => {
					const exists = localStorage.getItem(OLD_BACKUP_STATE_STORAGE_KEY);
					console.log({ exists })
					if (exists) {
						await store.dispatch(migrateDeviceToIdentities());
						return;
					}

					const pubkey = localStorage.getItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);


					if (pubkey) {

						await store.dispatch(switchIdentity(pubkey, true));
					}
				}}
				persistor={persistor}
				loading={<FullSpinner />}
			>
				<ScannerProvider>
					<IonApp>
						<ErrorBoundary>
							<AlertProvider>
								<ToastProvider>
									<IonReactRouter>
										<AppContent />
									</IonReactRouter>
									<AppJobs />
								</ToastProvider>
							</AlertProvider>
						</ErrorBoundary>
						<ToastContainer
							theme="colored"
							position="top-center"
							closeOnClick
							pauseOnHover
							autoClose={4000}
							limit={2}
							pauseOnFocusLoss={false}
						/>
					</IonApp>
				</ScannerProvider>
			</PersistGate>
		</Provider>
	);
};

export default App;
