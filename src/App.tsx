import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';

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
import { NodeUp } from './pages/NodeUp';
import { Provider } from 'react-redux';
import { Layout } from './Layout';
import { Loader } from './pages/Loader';
import { Home } from './pages/Home';
import { Receive } from './pages/Receive';
import { Send } from './pages/Send';
import { Scan } from './pages/Scan';
import { Sources } from './pages/Sources';
import { Automation } from './pages/Automation';
import { Prefs } from './pages/Prefs';
import { Contacts } from './pages/Contacts';

setupIonicReact();

const App: React.FC = () => (
  <Provider store={store}>
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Layout>
            <>
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
            </>
          </Layout>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </Provider>
);

export default App;
