import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import bootstrapShockwallet from './bootstrap';
import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';

if (!Capacitor.isNativePlatform()) {
	console.log("registering service worker");
	registerSW({
		immediate: true,

		onRegisteredSW(swScriptUrl, registration) {
			console.log("[PWA] registered", {
				swScriptUrl,
				active: registration?.active?.scriptURL,
				waiting: registration?.waiting?.scriptURL,
				installing: registration?.installing?.scriptURL,
			});

			registration?.addEventListener("updatefound", () => {
				console.log("[PWA] update found");

				const worker = registration.installing;

				worker?.addEventListener("statechange", () => {
					console.log("[PWA] worker state:", worker.state);
				});
			});
		},

		onNeedRefresh() {
			console.log("[PWA] onNeedRefresh called");
		},

		onOfflineReady() {
			console.log("[PWA] offline ready");
		},

		onRegisterError(error) {
			console.error("[PWA] registration failed", error);
		},
	});

	navigator.serviceWorker.addEventListener("controllerchange", () => {
		console.log("[PWA] controller changed");
	});
}



bootstrapShockwallet();

const container = document.getElementById('root');
const root = createRoot(container!);

defineCustomElements(window);

root.render(
	/*  <React.StrictMode> */
	<App />
	/*   </React.StrictMode> */
);
