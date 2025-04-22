import { Redirect, Route } from "react-router-dom";
import React, { useEffect } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import AppUrlListener from "./Hooks/appUrlListener";
import ErrorBoundary from "./Hooks/ErrorBoundary";
import { useDispatch } from 'react-redux';
import './App.scss';
import store from './State/store';
import { NodeUp } from './Pages/NodeUp';
import { Provider } from 'react-redux';
import { Layout } from './Layout';
import { Loader } from './Pages/Loader';
import { Home } from './Pages/Home';
import Receive from './Pages/Receive';
import { Send } from './Pages/Send';
import { Scan } from './Pages/Scan';
import { Sources } from './Pages/Sources';
import { Automation } from './Pages/Automation';
import { Prefs } from './Pages/Prefs';
import { Contacts } from './Pages/Contacts';
import { Invitations } from './Pages/Invitations';
import { Auth } from './Pages/Auth';
import { Background } from './Components/Background';
import { Notify } from './Pages/Notify';
import { Metrics } from './Pages/Metrics';
import { Manage } from "./Pages/Manage";
import { Channels } from "./Pages/Channels";
import { LinkedApp } from "./Pages/LinkedApp";
import { Offers } from "./Pages/Offers";
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
import { OfferInfo } from "./Pages/OfferInfo";
import { Stats } from "./Pages/Stats";
import NavigationMenu from "./Components/NavigationMenu";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from "./constants";


setupIonicReact();

const AppContent: React.FC = () => {
	const dispatch = useDispatch();

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


			<IonRouterOutlet id="main-content">

				<Route exact path="/home">
					<Layout>
						<Home />
					</Layout>
				</Route>
				<Route exact path="/nodeup">
					<Layout>
						<NodeUp />
					</Layout>
				</Route>
				<Route exact path="/">
					<BoostrapGuard />
				</Route>
				<Route exact path="/receive">
					<Receive />
				</Route>
				<Route exact path="/loader">
					<Layout>
						<Loader />
					</Layout>
				</Route>
				<Route exact path="/send">
					<Layout>
						<Send />
					</Layout>
				</Route>
				<Route exact path="/scan">
					<Layout>
						<Scan />
					</Layout>
				</Route>
				<Route path="/sources">
					<Layout>
						<Sources />
					</Layout>
				</Route>
				<Route exact path="/automation">
					<Layout>
						<Automation />
					</Layout>
				</Route>
				<Route exact path="/prefs">
					<Layout>
						<Prefs />
					</Layout>
				</Route>
				<Route exact path="/contacts">
					<Layout>
						<Contacts />
					</Layout>
				</Route>
				<Route exact path="/invitations">
					<Layout>
						<Invitations />
					</Layout>
				</Route>
				<Route exact path="/auth">
					<Layout>
						<Auth />
					</Layout>
				</Route>
				<Route exact path="/notify">
					<Layout>
						<Notify />
					</Layout>
				</Route>
				<Route exact path="/metrics">
					<Layout>
						<Metrics />
					</Layout>
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
					<Layout>
						<LinkedApp />
					</Layout>
				</Route>
				<Route exact path="/Offers">
					<Layout>
						<Offers />
					</Layout>
				</Route>
				<Route exact path="/OfferInfo">
					<Layout>
						<OfferInfo />
					</Layout>
				</Route>
				<Route exact path="/Stats">
					<Layout>
						<Stats />
					</Layout>
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


	return (
		<Provider store={store}>
			<IonApp>
				<ErrorBoundary>
					<IonReactRouter>
						<AppContent />
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
		</Provider>
	);
};

export default App;
