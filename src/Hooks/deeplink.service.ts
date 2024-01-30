import { useIonRouter, useIonAlert } from "@ionic/react";
import { Capacitor } from '@capacitor/core';
import capacitorConfig from '../../capacitor.config';

const { appName, appId } = capacitorConfig;
const { Linking } = Capacitor.Plugins;

const appLink = `${appName}://open`; // get app name

export const DeeplinkService = (link: string) => {
    // const appInstalled = isAppInstalled(); // check app installation
    // Linking.openUrl.App.openUrl('tg://')
    const isiPhone = /iPhone|iPod/.test(navigator.platform);
    if(isiPhone) {
        window.location.href = appLink.toLowerCase();
        // window.open(appLink.toLowerCase(), '_self')
        // window.location.href = 'https://test.shockwallet.app/open/';
    }
}
