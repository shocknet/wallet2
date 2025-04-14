import { useCallback, useEffect } from "react";
import { App } from "@capacitor/app";
import { useDispatch, useSelector } from "@/State/store";
import { listenforNewOperations } from "@/State/history/thunks";
import { SplashScreen } from "@capacitor/splash-screen";
import { initLocalNotifications } from "../local-notifications";
import { useAlert } from "../contexts/useAlert";
import { usePreference } from "./usePreference";

const DENIED_NOTIFICATIONS_PERMISSIONS = "notif_perm_denied";


export const useAppLifecycle = () => {
  const dispatch = useDispatch();

  const nodedUp = useSelector(state => state.nostrPrivateKey);

  const { cachedValue, setValue, isLoaded } = usePreference<boolean>(DENIED_NOTIFICATIONS_PERMISSIONS, false);

  const { showAlert } = useAlert();



  useEffect(() => {
    console.log("App started: Running initial setup...");

    // App start
    const appStartUp = async () => {
      if (nodedUp) { // tasks that should only take place after noding up
        dispatch(listenforNewOperations());
      }
      SplashScreen.hide();
    }
    appStartUp();


    // App resume
    const onAppResume = async () => {
      console.log("App resumed");
      if (nodedUp) { // tasks that should only take place after noding up
        dispatch(listenforNewOperations());
      }
    };

    // App pause
    const onAppPause = () => {
      console.log("App paused.");
      // Handle background tasks if needed
    };

    const listener = App.addListener("appStateChange", (state) => {
      if (state.isActive) {
        onAppResume();
      } else {
        onAppPause();
      }
    });

    return () => {
      listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, nodedUp]);



  /* Handle notifications */
  const handleInitNotifications = useCallback(async () => {
    if (cachedValue) {
      return;
    }

    const showPermissionAlert = async () => {
      return new Promise<boolean>((resolve) => {
        showAlert({
          header: "Notifications Blocked",
          message: "We need notification permissions to alert you about transactions. Would you like to enable them now?",
          buttons: [
            {
              text: "Not Now",
              role: 'cancel',
              handler: () => resolve(false)
            },
            {
              text: "Enable",
              handler: () => resolve(true)
            }
          ]
        });
      });
    };

    const hasPermission = await initLocalNotifications(showPermissionAlert);
    if (!hasPermission) {
      showAlert({
        header: "Notifications Disabled",
        message: "You can enable notifications later in settings.",
        buttons: ['OK']
      });
      setValue(true);
    }
  }, [cachedValue, setValue, showAlert]);

  useEffect(() => {
    const appStartUp = async () => {
      if (isLoaded) {
        await handleInitNotifications();
      }

    }
    appStartUp();


    // App resume
    const onAppResume = async () => {
      console.log("App resumed");
      if (isLoaded) {
        await handleInitNotifications();
      }
    };

    // App pause
    const onAppPause = () => {
      console.log("App paused.");
      // Handle background tasks if needed
    };

    const listener = App.addListener("appStateChange", (state) => {
      if (state.isActive) {
        onAppResume();
      } else {
        onAppPause();
      }
    });

    return () => {
      listener.remove();
    };
  }, [dispatch, isLoaded, handleInitNotifications])
};
