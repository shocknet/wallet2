import { useIonRouter, useIonAlert } from "@ionic/react";
import { Plugins } from '@capacitor/core';
import capacitorConfig from '../../capacitor.config';

const { appName, appId } = capacitorConfig;
const { Linking } = Plugins;

const appLink = `${appName}://open`; // get app name

export const DeeplinkService = async (link: string) => {
    const router = useIonRouter();
    router.push(`https://apps.apple.com/app/${appId}`)
    // const appInstalled = await isAppInstalled(); // check app installation
    alert('start deep linking')
    alert('app is installed')
    const incomingURL = navigator.userAgent.toLowerCase(); // decode incoming URL
    const isAndroid = incomingURL.indexOf("android") > -1; // android check
    const isIphone = incomingURL.indexOf("iphone") > -1; // ios check

    const openApp = async () => {
        await Linking.openUrl(appLink);
    };

    if (isIphone) {
        alert('you are in iphone')
        openApp();
    } else if (isAndroid) {
        alert('you are in android')
    } else{
        alert('you are in desktop')
    }
}

// in case app is not installed yet, it shows users alert to install the app from app store
export const useInstallAppAlert = () => {
    const appStoreURL = `https://apps.apple.com/app/${appId}`;

    // show alert to install the app
    const confirm = window.confirm("App Not Installed, To use this feature, please install our app.");
    if(confirm) {
        return appStoreURL;
    } else {
        return '/#';
    }
};

// check wonder the app is installed
export const isAppInstalled = async (): Promise<boolean> => {
    try {
      await Linking.openUrl(appLink);
      return true;
    } catch (error) {
      console.log('Your app is not installed.');
    }
    return false;
};