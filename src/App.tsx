import { Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
  useIonRouter
} from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router';
import { StatusBar } from '@capacitor/status-bar';
import AppUrlListener from './Hooks/appUrlListener';
import { DeeplinkService, isAppInstalled, useInstallAppAlert } from './Hooks/deeplink.service';

/* Core CSS required for Ionic components to work properly */
// import '@ionic/react/css/core.css';

// /* Basic CSS for apps built with Ionic */
// import '@ionic/react/css/normalize.css';
// import '@ionic/react/css/structure.css';
// import '@ionic/react/css/typography.css';

// /* Optional CSS utils that can be commented out */
// import '@ionic/react/css/padding.css';
// import '@ionic/react/css/float-elements.css';
// import '@ionic/react/css/text-alignment.css';
// import '@ionic/react/css/text-transformation.css';
// import '@ionic/react/css/flex-utils.css';
// import '@ionic/react/css/display.css';

// /* Theme variables */
// import './theme/variables.css';
import './App.scss';
import store from './State/store';
import { NodeUp } from './Pages/NodeUp';
import { Provider } from 'react-redux';
import { Layout } from './Layout';
import { Loader } from './Pages/Loader';
import { Home } from './Pages/Home';
import { Receive } from './Pages/Receive';
import { Send } from './Pages/Send';
import { Scan } from './Pages/Scan';
import { Sources } from './Pages/Sources';
import { Automation } from './Pages/Automation';
import { Prefs } from './Pages/Prefs';
import { Contacts } from './Pages/Contacts';
import { useEffect, useState } from 'react';
import { Auth } from './Pages/Auth';
import { Background } from './Components/Background';
import { isBrowser } from 'react-device-detect'
import { Notify } from './Pages/Notify';
import { Metrics } from './Pages/Metrics';

setupIonicReact();

const App: React.FC = () => {
  const router = useIonRouter();

  // deep linking handler to open App
  const handleDeepLink = async (link: string = '') => {
    const appInstalled = await isAppInstalled();
    if(appInstalled) {
      DeeplinkService(link);
    } else {
      const showAlert: string = useInstallAppAlert();
      router.push(showAlert);
    }
  }

  useEffect(() => {
    if (!isBrowser) setStatusBarColor(); // check wonder it is opened in browser
    // call deep link
    setTimeout(() => {
      handleDeepLink();
    }, 1000);
  }, [router]);

  const setStatusBarColor = async () => {
    await StatusBar.setBackgroundColor({ color: '#16191c' }); // Replace with your desired color code
  };

  return (
    <Provider store={store}>
      <IonApp className='safe-area'>
        <IonReactHashRouter>
          <IonRouterOutlet style={{ position: "static" }}>
            <Layout>
              <>
                <Background />
                <AppUrlListener />
                <Route exact path="/">
                  <NodeUp />
                </Route>
                <Route exact path="/loader">
                  <Loader />
                </Route>
                <Route exact path="/home">
                  <Home />
                </Route>
                <Route exact path="/receive">
                  <Receive />
                </Route>
                <Route exact path="/send">
                  <Send />
                </Route>
                <Route exact path="/scan">
                  <Scan />
                </Route>
                <Route exact path="/sources">
                  <Sources />
                </Route>
                <Route exact path="/automation">
                  <Automation />
                </Route>
                <Route exact path="/prefs">
                  <Prefs />
                </Route>
                <Route exact path="/contacts">
                  <Contacts />
                </Route>
                <Route exact path="/auth">
                  <Auth />
                </Route>
                <Route exact path="/notify">
                  <Notify />
                </Route>
                <Route exact path="/metrics">
                  <Metrics />
                </Route>
              </>
            </Layout>
          </IonRouterOutlet>
        </IonReactHashRouter>
      </IonApp>
    </Provider>
  )
};

export default App;
