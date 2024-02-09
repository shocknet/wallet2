import { Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router';
import { StatusBar } from '@capacitor/status-bar';
import AppUrlListener from './Hooks/appUrlListener';

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
import { useEffect } from 'react';
import { Auth } from './Pages/Auth';
import { Background } from './Components/Background';
import { isBrowser } from 'react-device-detect'
import { Notify } from './Pages/Notify';
import { Metrics } from './Pages/Metrics';

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
      <IonApp className='safe-area'>
        <IonReactHashRouter>
          <AppUrlListener />
          <IonRouterOutlet>
            <Layout>
              <>
                <Background />
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
