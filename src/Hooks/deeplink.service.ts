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
        // window.location.href = appLink.toLowerCase();
        window.open(appLink.toLowerCase(), '_self')
        // window.location.href = 'https://test.shockwallet.app/open/';
    }
    // try {
    //     window.location.href = appLink;
    //     return true;
    // } catch (error) {
    //     alert('asdfasdf')
    //     return false;
    // }
    // // window.open('tgd://', '_self')
    // if(appInstalled) {
    //     alert('app is installed')
    //     const incomingURL = navigator.userAgent.toLowerCase(); // decode incoming URL
    //     const isAndroid = incomingURL.indexOf("android") > -1; // android check
    //     const isIphone = incomingURL.indexOf("iphone") > -1; // ios check

    //     const openApp = async () => {
    //         await Linking.openUrl(appLink);
    //     };

    //     if (isIphone) {
    //         alert('you are in iphone')
    //         openApp();
    //     } else if (isAndroid) {
    //         alert('you are in android')
    //     } else{
    //         alert('you are in desktop')
    //     }
    // } else {
    //     alert('app is not installed')
    //     useInstallAppAlert();
    // }
}

// // in case app is not installed yet, it shows users alert to install the app from app store
// const useInstallAppAlert = async () => {
//     const openAppStore = () => {
//         const appStoreURL = `https://apps.apple.com/app/${appId}`;
//         Linking.openUrl(appStoreURL);
//     };

//     // show alert to install the app
//     if (window.confirm("App Not Installed, To use this feature, please install our app.")) {
//         openAppStore();
//     }
// };

// // check wonder the app is installed
// const isAppInstalled = async (): Promise<boolean> => {
//     try {
//       await Linking.openUrl('tg://');
//       return true;
//     } catch (error) {
//         return false;
//     }
// };