import { Redirect, Route } from "react-router-dom";
import React, { lazy, Suspense, useEffect } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { StatusBar } from "@capacitor/status-bar";
import AppUrlListener from "./Hooks/appUrlListener";
import ErrorBoundary from "./Hooks/ErrorBoundary";
import { useDispatch } from 'react-redux';

import './App.scss';
import store, { persistor } from './State/store';
import { Layout } from "./Layout";

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
const Manage = lazy(() => import('./Pages/Manage'));
const Channels = lazy(() => import('./Pages/Channels'));
const Home = lazy(() => import('./Pages/Home'));
const LinkedApp = lazy(() => import('./Pages/LinkedApp'));
const Offers = lazy(() => import('./Pages/Offers'));
const Stats = lazy(() => import("./Pages/Stats"));
const OfferInfo = lazy(() => import("./Pages/OfferInfo"));

import { Background } from "./Components/Background";
import { Provider } from 'react-redux';
import { ToastContainer } from "react-toastify";
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

import LoadingOverlay from "./Components/LoadingOverlay";
import { DebitRequestModal, EditDebitModal } from "./Components/Modals/DebitRequestModal";
import { EditSourceModal } from "./Components/Modals/EditSourceModal";


import NavigationMenu from "./Components/NavigationMenu";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from "./constants";
import { PersistGate } from "redux-persist/integration/react";
import { useAppLifecycle } from "./lib/hooks/useAppLifecycle";
import { AlertProvider } from "./lib/contexts/useAlert";
import { ToastProvider } from "./lib/contexts/useToast";
import nostrSvg from "../icons/nostr.svg"
import { addIcons } from "ionicons";
import FullSpinner from "./Components/common/ui/fullSpinner";



addIcons({
	nostr: nostrSvg,
})


setupIonicReact();

const AppContent: React.FC = () => {
	const dispatch = useDispatch();

	useAppLifecycle();


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
			<AppUrlListener />
			<Background />
			<LoadingOverlay />

			{/* Modals */}
			<DebitRequestModal />
			<EditDebitModal />
			<EditSourceModal />
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
						<Layout>
							<NodeUp />
						</Layout>
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
				{/*         <Route exact path="/manage">
          <Layout>
            <Manage />
          </Layout>
        </Route>
        <Route exact path="/channels">
          <Layout>
            <Channels />
          </Layout>
        </Route> */}
				<Route exact path="/LApps">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<LinkedApp />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/Offers">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<Offers />
						</Layout>
					</Suspense>
				</Route>
				<Route exact path="/OfferInfo">
					<Suspense fallback={<FullSpinner />}>
						<Layout>
							<OfferInfo />
						</Layout>
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
	console.log({ hasBootstrapped })

	return hasBootstrapped ? (
		<Redirect to="/home" />
	) : (
		<Redirect to="/nodeup" />
	);
};

const App: React.FC = () => {
	const setStatusBarColor = async () => {
		await StatusBar.setBackgroundColor({ color: "#16191c" });
	};

	useEffect(() => {
		setStatusBarColor();
	}, []);

	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
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
			</PersistGate>
		</Provider>
	);
};

export default App;
