import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
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
      recogParam(event.url)
    });
  }, []);

  const recogParam = (param: string) => {
    param = param.toLowerCase();
    const paramArr = param.split("://");
    switch (paramArr[1]) {
      case "open":
        router.push("/")
        break;
      case "bitcoin":
        router.push("/send?url=" + paramArr[1])
        break;
      case "lightning":
        decodeLNURL(paramArr[1])
        break;
    }
  }
  //when get lnurl protocol
  const decodeLNURL = (lnurl: string) => {
    if ((lnurl[0] + lnurl[1]) == "ln") {
      router.push("/send?url=" + lnurl)
    } else {
      try {
        let { words: dataPart } = bech32.decode(lnurl, 2000);
        let sourceURL = bech32.fromWords(dataPart);
        const lnurlLink = Buffer.from(sourceURL).toString();

        if (lnurlLink.includes(requestTag.lnurlPay)) {
          router.push("/send?url=" + lnurl)
        } else if (lnurlLink.includes(requestTag.lnurlWithdraw)) {
          router.push("/sources?url=" + lnurl)
        }
      } catch (error) {
        console.log(error);
        // router.push("/send?url="+lnurl);
      }
    }
  }

  return null;
};

export default AppUrlListener;