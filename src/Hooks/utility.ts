// utils.ts
import { useIonRouter, useIonAlert  } from "@ionic/react";

export const useInstallAppAlert = () => {
  const [presentAlert] = useIonAlert();
  const router = useIonRouter();


  const showInstallAlertIfNeeded = () => {
    // Replace this with your actual check for app installation
    const isAppInstalled = false;

    if (!isAppInstalled) {
      presentAlert({
        header: 'App Not Installed',
        message: 'To use this feature, please install our app.',
        buttons: [
          {
            text: 'Install App',
            handler: () => {
              openAppStore();
            },
          },
          'Cancel',
        ],
      });
    }
  };

  const openAppStore = () => {
    // Replace the URL with the actual App Store URL for your app
    const appStoreURL = 'https://apps.apple.com/app/your-app-id';
    router.push(appStoreURL);
  };

  return { showInstallAlertIfNeeded };
};

// utils.ts
export const isAppInstalled = (): boolean => {
  const customScheme = 'yourapp://';
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = customScheme;
  document.body.appendChild(iframe);

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 300);

  return true; // You may need to implement more robust logic based on the specific scenario.
};
