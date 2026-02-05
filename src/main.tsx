import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { registerRootLifecycle } from './State/runtime/lifecycle';
import { initLocalNotifications } from './notifications/local/local-notifications';
import { initPushNotifications } from './notifications/push/init';

registerRootLifecycle();

initPushNotifications();
initLocalNotifications();

// Load test helpers in development
if (import.meta.env.DEV) {
	import('./notifications/push/testHelpers');
}

const container = document.getElementById('root');
const root = createRoot(container!);

defineCustomElements(window);

root.render(
	/*  <React.StrictMode> */
	<App />
	/*   </React.StrictMode> */
);
