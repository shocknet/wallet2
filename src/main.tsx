import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { registerRootLifecycle } from './State/runtime/lifecycle';

registerRootLifecycle();

const container = document.getElementById('root');
const root = createRoot(container!);

defineCustomElements(window);

root.render(
	/*  <React.StrictMode> */
	<App />
	/*   </React.StrictMode> */
);
