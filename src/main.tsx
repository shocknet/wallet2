import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { registerRootLifecycle } from './State/runtime/lifecycle';
import { initLocalNotifications } from './notifications/local/local-notifications';
import { initPushNotifications } from './notifications/push/init';

/*
	A web user visiting new build after having used an older build
	may run into dynamic import errors when navigating to lazily loaded pages.
	See: https://vite.dev/guide/build#load-error-handling
*/
window.addEventListener('vite:preloadError', (event) => {
	event.preventDefault();
	window.location.reload();
});


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
