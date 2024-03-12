import { Route } from 'react-router-dom';
import React, { useEffect } from 'react';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router';
import { StatusBar } from '@capacitor/status-bar';
import AppUrlListener from './Hooks/appUrlListener';
import ErrorBoundary from './Hooks/ErrorBoundary';

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
import { Auth } from './Pages/Auth';
import { Background } from './Components/Background';
import { isBrowser } from 'react-device-detect'
import { Notify } from './Pages/Notify';
import { Metrics } from './Pages/Metrics';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import LoadingOverlay from './Components/LoadingOverlay';


setupIonicReact();

const App: React.FC = () => {

  useEffect(() => {
    if (!isBrowser) setStatusBarColor(); // check wonder it is opened in browser
  }, []);

  const setStatusBarColor = async () => {
    await StatusBar.setBackgroundColor({ color: '#16191c' });
  };

  return (
    <Provider store={store}>
      <IonApp className="safe-area">
        <ErrorBoundary>
          <IonReactHashRouter>
            <AppUrlListener />
            <Background />
            <LoadingOverlay />
            <IonRouterOutlet>
              <Route exact path="/">
                <Layout>
                  <NodeUp />
                </Layout>
              </Route>
              <Route exact path="/loader">
                <Layout>
                  <Loader />
                </Layout>
              </Route>
              <Route exact path="/home">
                <Layout>
                  <Home />
                </Layout>
              </Route>
              <Route exact path="/receive">
                <Layout>
                  <Receive />
                </Layout>
              </Route>
              <Route exact path="/send">
                <Layout>
                  <Send />
                </Layout>
              </Route>
              <Route exact path="/scan">
                <Layout>
                  <Scan />
                </Layout>
              </Route>
              <Route exact path="/sources">
                <Layout>
                  <Sources />
                </Layout>
              </Route>
              <Route exact path="/automation">
                <Layout>
                  <Automation />
                </Layout>
              </Route>
              <Route exact path="/prefs">
                <Layout>
                  <Prefs />
                </Layout>
              </Route>
              <Route exact path="/contacts">
                <Layout>
                  <Contacts />
                </Layout>
              </Route>
              <Route exact path="/auth">
                <Layout>
                  <Auth />
                </Layout>
              </Route>
              <Route exact path="/notify">
                <Layout>
                  <Notify />
                </Layout>
              </Route>
              <Route exact path="/metrics">
                <Layout>
                  <Metrics />
                </Layout>
              </Route>
            </IonRouterOutlet>
          </IonReactHashRouter>
        </ErrorBoundary>
        <ToastContainer
          theme="colored"
          position="top-center"
          closeOnClick
          pauseOnHover
          autoClose={4000}
          limit={2}
          pauseOnFocusLoss={false}
        />
      </IonApp>
    </Provider>
  )
};

export default App;
