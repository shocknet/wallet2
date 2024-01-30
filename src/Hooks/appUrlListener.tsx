import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Plugins } from '@capacitor/core';
import { useIonRouter } from '@ionic/react';
import { bech32 } from 'bech32';
import { Buffer } from 'buffer';

const AppUrlListener: React.FC<any> = () => {
  const router = useIonRouter();
  const requestTag = {
    lnurlPay: "pay",
    lnurlWithdraw: "withdraw",
  }

  useEffect(() => {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const incomingUrl = event.url.toLowerCase();
      const url = new URL(event.url);
      const urlArr = incomingUrl.split(".app");
      const redirectUrlArr = urlArr[1].split("#");
      return router.push(redirectUrlArr[1]);
    });
  }, []);
  
  return null;
};

export default AppUrlListener;