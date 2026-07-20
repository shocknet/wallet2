import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import bootstrapShockwallet from './bootstrap';
import { registerSW } from 'virtual:pwa-register';


registerSW({
	immediate: true,
	onRegisteredSW(swScriptUrl, registration) {
		console.info('Service worker registered', swScriptUrl, registration);
	},
	onOfflineReady() {
		console.log('App is completely cached and ready to work offline.');
	}
});


bootstrapShockwallet();

const container = document.getElementById('root');
const root = createRoot(container!);

defineCustomElements(window);

root.render(
	/*  <React.StrictMode> */
	<App />
	/*   </React.StrictMode> */
);
