import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { Capacitor } from '@capacitor/core';
import { startPushCapture } from './notifications/push/capture';
import { startServiceWorker } from './swUpdate';

if (!Capacitor.isNativePlatform()) {
	startServiceWorker();
}

startPushCapture();

const container = document.getElementById('root');
const root = createRoot(container!);

defineCustomElements(window);

root.render(
	/*  <React.StrictMode> */
	<App />
	/*   </React.StrictMode> */
);
