import React, { useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { useIonRouter } from '@ionic/react';

const AppUrlListener: React.FC<any> = () => {
  const router = useIonRouter();

  useEffect(() => {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const slug = event.url.split(".app").pop();
      if (slug) {
        router.push(slug);
      }
    });
  }, []);
  return null;
};

export default AppUrlListener;