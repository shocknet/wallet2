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
      const slug = event.url.split(".app").pop();
      if (slug) {
        router.push(slug);
      }
    });
  }, []);
  return null;
};

export default AppUrlListener;