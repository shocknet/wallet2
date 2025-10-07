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

import { Redirect, Route } from "react-router-dom";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import ErrorBoundary from "./Hooks/ErrorBoundary";
import { useDispatch } from 'react-redux';
import store, { useSelector } from './State/store';
import { Layout } from "./Layout";
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
import { useNodeUpCheck } from './lib/backgroundHooks/useNodeUpCheck';



/* Lazily loaded pages */
const NodeUp = lazy(() => import('./Pages/NodeUp'));
const Loader = lazy(() => import('./Pages/Loader'));
const Receive = lazy(() => import('./Pages/Receive'));
const Send = lazy(() => import('./Pages/Send'));
const Sources = lazy(() => import('./Pages/Sources'));
const Automation = lazy(() => import('./Pages/Automation'));
const Prefs = lazy(() => import('./Pages/Prefs'));
const Contacts = lazy(() => import('./Pages/Contacts'));
const Invitations = lazy(() => import('./Pages/Invitations'));
const Auth = lazy(() => import('./Pages/Auth'));
const Notify = lazy(() => import('./Pages/Notify'));
const Metrics = lazy(() => import('./Pages/Metrics'));
const Home = lazy(() => import('./Pages/Home'));
const LinkedApp = lazy(() => import('./Pages/LinkedApp'));
const Offers = lazy(() => import('./Pages/Offers'));
const Stats = lazy(() => import("./Pages/Stats"));
const Earnings = lazy(() => import("./Pages/Metrics/earnings"));
const Routing = lazy(() => import("./Pages/Metrics/routing"));
const Management = lazy(() => import("./Pages/Management"));

/* Lazily loaded components */
const BackgroundJobs = lazy(() => import("@/lib/backgroundHooks")); // Background jobs
const ManageRequestsModal = lazy(() => import("@/Components/Modals/ManageRequestModal"));
const DebitRequestModal = lazy(() => import("@/Components/Modals/DebitRequestModal").then(mod => ({ default: mod.DebitRequestModal })));
const EditDebitModal = lazy(() => import("@/Components/Modals/DebitRequestModal").then(mod => ({ default: mod.EditDebitModal })));

addIcons({
	nostr: nostrSvg,
})
setupIonicReact();
document.documentElement.classList.add('dark');

const AppContent: React.FC = () => {
	const dispatch = useDispatch();
	useAppUrlListener();
	useNodeUpCheck();
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




	useEffect(() => {
		const handleUrlParams = () => {
			const url = new URL(window.location.href);
			const addSource = url.searchParams.get('addSource');
			const inviteToken = url.searchParams.get('inviteToken');

			if (addSource) {
				dispatch({ type: 'SHOW_ADD_SOURCE_CONFIRMATION', payload: { addSource, inviteToken } });
				window.history.replaceState({}, document.title, url.pathname);
			}
		};

		handleUrlParams();
		window.addEventListener('popstate', handleUrlParams);

		return () => {
			window.removeEventListener('popstate', handleUrlParams);
		};
	}, [dispatch]);

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

			{/* Modals */}

			<NavigationMenu />
			<IonRouterOutlet id="main-content" animated={true}
			>
				<Route exact path="/home" render={(props) =>
					<Suspense fallback={<FullSpinner />}>
						<Home {...props} />
					</Suspense>
				}
				/>
				<Route exact path="/nodeup">
					<Suspense fallback={<FullSpinner />}>
						<NodeUp />
					</Suspense>
				</Route>
				<Route exact path="/">
					<Suspense fallback={<FullSpinner />}>
						<BoostrapGuard />
					</Suspense>
				</Route>
				<Route exact path="/receive">
					<Suspense fallback={<FullSpinner />}>
						<Receive />
					</Suspense>
				</Route>
				<Route exact path="/loader">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Loader />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/send" render={(props) =>
					<Suspense fallback={<FullSpinner />}>
						<Send {...props} />
					</Suspense>
				}
				/>
				<Route path="/sources">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Sources />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/automation">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Automation />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/prefs">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Prefs />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/contacts">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Contacts />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/invitations">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Invitations />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/auth">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Auth />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/notify">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Notify />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/metrics">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Metrics />
						</Layout>
					</Suspense>

				</Route>
				<Route exact path="/metrics/earnings">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Earnings />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/metrics/routing">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Routing />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/LApps">

					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<LinkedApp />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/management">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Management />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/Offers">
					<Suspense fallback={<FullSpinner />}>
						<Offers />
					</Suspense>
				</Route>
				<Route exact path="/Stats">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Stats />
						</Layout>
					</Suspense>
				</Route>
			</IonRouterOutlet>
		</>
	);
};

const BoostrapGuard: React.FC = () => {
	const hasBootstrapped = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);


	return hasBootstrapped ? (
		<Redirect to="/home" />
	) : (
		<Redirect to="/nodeup" />
	);
};

const App: React.FC = () => {
	useEffect(() => {
		StatusBar.setOverlaysWebView({ overlay: false });
		StatusBar.setBackgroundColor({ color: "#16191c" })
	}, []);


	return (
		<Provider store={store}>
			<ScannerProvider>
				<IonApp>
					<ErrorBoundary>
						<IonReactRouter>
							<AlertProvider>
								<ToastProvider>
									<AppContent />
								</ToastProvider>
							</AlertProvider>
						</IonReactRouter>
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
		</Provider>
	);
};

export default App;
