import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { useIonRouter } from '@ionic/react';

const AppUrlListener: React.FC<any> = () => {
    const router = useIonRouter();
    let history = useHistory();
    useEffect(() => {
      App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        router.push("/bitcoin")
        if (event.url.includes("bitcoin:")) {
          
        }else if (event.url.includes("lightning:")) {

        }
      });
    }, []);
  
    return null;
};
  
export default AppUrlListener;