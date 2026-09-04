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
import '@ionic/react/css/global.bundle.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import "./theme/tailwind.css";
import "./theme/variables.css";
import "./theme/pub-dash.css";

import { IonApp, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "@/State/store/store";
import { ShellBootstrap } from "@/shell/ShellBootstrap";
import { AppShell } from "@/shell/AppShell";
import { Provider } from "react-redux";
import ErrorBoundary from "./Hooks/ErrorBoundary";
import { ToastProvider } from "./lib/contexts/useToast";
import { ScannerProvider } from "./lib/contexts/pwaScannerProvider";
import { AlertProvider } from "./lib/contexts/useAlert";
import { ToastContainer } from 'react-toastify';
import { addIcons } from 'ionicons';
import nostrSvg from "../icons/nostr.svg";
import { SplashScreen } from "@capacitor/splash-screen";
import { ShellEffects } from './shell/ShellEffects';

addIcons({
	nostr: nostrSvg,
});

setupIonicReact();

export default function App() {
	return (
		<ErrorBoundary>
			<Provider store={store}>
				<PersistGate
					loading={null}
					persistor={persistor}
					onBeforeLift={() =>
						SplashScreen.hide()
					}
				>
					<ToastProvider>
						<ScannerProvider>
							<AlertProvider>
								<IonApp>
									<IonReactRouter>
										<ShellBootstrap />
										<ShellEffects />
										<AppShell />
									</IonReactRouter>
								</IonApp>
							</AlertProvider>
						</ScannerProvider>
					</ToastProvider>
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
}
