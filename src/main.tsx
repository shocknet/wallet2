import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { registerRootLifecycle } from './State/runtime/lifecycle';
import { initLocalNotifications } from './notifications/local/local-notifications';
import { initPushNotifications } from './notifications/push/init';

registerRootLifecycle();

initPushNotifications();
initLocalNotifications();



const container = document.getElementById('root');
const root = createRoot(container!);

defineCustomElements(window);

root.render(
	/*  <React.StrictMode> */
	<App />
	/*   </React.StrictMode> */
);
