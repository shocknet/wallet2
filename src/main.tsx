import { registerSW } from 'virtual:pwa-register';
import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import bootstrapShockwallet from './bootstrap';
import { Capacitor } from '@capacitor/core';


if (!Capacitor.isNativePlatform()) {
	const intervalMS = 60 * 60 * 1000;

	registerSW({
		immediate: true,
		onRegisteredSW(swUrl, r) {
			if (!r) return;

			setInterval(async () => {
				if (r.installing || !navigator) return;

				if (("connection" in navigator) && !navigator.onLine) return;

				const resp = await fetch(swUrl, {
					cache: "no-store",
					headers: {
						cache: "no-store",
						"cache-control": "no-cache",
					},
				});

				if (resp?.status === 200) {
					await r.update();
				}
			}, intervalMS);
		},
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
