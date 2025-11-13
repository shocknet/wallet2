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
import "./theme/tailwind.css";
import "./theme/variables.css";

import { Redirect, Route } from "react-router-dom";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
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
import { Layout } from './Layout';

import CreateIdentityPage from './Pages/CreateIdentity';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';


import { StatusBar, Style } from "@capacitor/status-bar";
import { HAS_MIGRATED_TO_IDENTITIES_STORAGE_KEY, NOSTR_PRIVATE_KEY_STORAGE_KEY } from './constants';
import { initialState as backupInitialState } from "@/State/Slices/backupState";
import IonicStorageAdapter from './storage/redux-persist-ionic-storage-adapter';
import { GuardedRoute } from './routing/GaurdedRoute';
import { atLeastOneHealthyAdminNprofileSourceGuard, atLeastOneHealthyNprofileSourceGuard, loadedIdentityGuard } from './routing/guards';


async function setEnvColors() {
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



	const identityKey = useAppSelector(selectActiveIdentityId);


	return (
		<IonReactRouter>
			<AppJobs />
			<NavigationMenu />
			<IonRouterOutlet id="main-content" key={`session-${identityKey}`}>
				<GuardedRoute
					exact
					path="/identities"
					component={IdentitiesPage}
				/>

				<GuardedRoute
					exact
					path="/identity/create"
					component={CreateIdentityPage}
				/>

				<GuardedRoute
					exact
					path="/identity/create/keys"
					component={CreateKeysIdentityPage}

				/>
				<GuardedRoute
					exact
					path="/identity/create/sanctum"
					component={CreateSanctumIdentityPage}

				/>

				<GuardedRoute
					exact
					path="/identity/bootstrap"
					component={BootstrapSourcePage}

					guards={[loadedIdentityGuard]}
				/>



				<GuardedRoute
					exact
					path="/identity/overview"
					component={IdentityOverviewPage}

					guards={[loadedIdentityGuard]}
				/>



				<GuardedRoute

					exact
					path="/home"
					component={Home}

					guards={[loadedIdentityGuard]}
				/>

				<GuardedRoute

					exact
					path="/send"
					component={Send}

					guards={[loadedIdentityGuard, atLeastOneHealthyNprofileSourceGuard]}
				/>

				<GuardedRoute

					exact
					path="/Receive"
					component={Receive}

					guards={[loadedIdentityGuard]}
				/>

				<GuardedRoute
					exact
					path="/sources"
					component={SourcesPage}

					guards={[loadedIdentityGuard]}
				/>


				<GuardedRoute
					exact
					path="/automation"
					component={Automation}

					guards={[loadedIdentityGuard]}
					layout={Layout}
				/>

				<GuardedRoute
					exact
					path="/prefs"
					component={Prefs}

					guards={[loadedIdentityGuard]}
					layout={Layout}
				/>


				<GuardedRoute
					exact
					path="/contacts"
					component={Contacts}

					guards={[loadedIdentityGuard]}
					layout={Layout}
				/>

				<GuardedRoute
					exact
					path="/invitations"
					component={Invitations}

					guards={[loadedIdentityGuard]}
					layout={Layout}
				/>

				<GuardedRoute
					exact
					path="/notify"
					component={Notify}

					guards={[loadedIdentityGuard]}
					layout={Layout}
				/>


				<GuardedRoute
					exact
					path="/management"
					component={Management}

					guards={[loadedIdentityGuard]}
					layout={Layout}
				/>

				<GuardedRoute
					path="/metrics"
					component={Metrics}

					guards={[loadedIdentityGuard, atLeastOneHealthyAdminNprofileSourceGuard]}

				/>




				<GuardedRoute
					exact
					path="/offers"
					component={Offers}

					guards={[loadedIdentityGuard, atLeastOneHealthyNprofileSourceGuard]}
				/>


				<GuardedRoute
					exact
					path="/Stats"
					component={Stats}

					guards={[loadedIdentityGuard]}
					layout={Layout}
				/>


				<GuardedRoute
					exact
					path="/LApps"
					component={LinkedApp}
					layout={Layout}

					guards={[loadedIdentityGuard]}
				/>


				<Route exact path="/" >
					<Redirect to="/home" />
				</Route>
			</IonRouterOutlet >
		</IonReactRouter >
	);
};


const App: React.FC = () => {


	return (
		<ErrorBoundary>
			<Provider store={store}>
				<PersistGate
					onBeforeLift={async () => {
						const exists = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
						const hasRanMigration = await IonicStorageAdapter.getItem(HAS_MIGRATED_TO_IDENTITIES_STORAGE_KEY)

						try {
							if (exists || !hasRanMigration) {
								localStorage.removeItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);
								await store.dispatch(migrateDeviceToIdentities());
								return
							}
						} catch (err: any) {
							const subbedToBackUp = backupInitialState;
							if (subbedToBackUp.subbedToBackUp) {
								if (subbedToBackUp.usingSanctum) {
									alert(
										`An error occured with Sanctum: \n\n ${err?.message || ""}`
									);
								} else if (subbedToBackUp.usingExtension) {
									alert(
										`An error occured with NIP07 extension: \n\n ${err?.message || ""}`
									);
								} else {
									alert(
										`An un known error occured: \n\n ${err?.message || ""}`
									);
								}
							} else {
								alert(
									`An un known error occured: \n\n ${err?.message || ""}`
								);
							}
							await new Promise(() => {/*  */ })

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
