import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

const container = document.getElementById('root');
const root = createRoot(container!);

defineCustomElements(window);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);