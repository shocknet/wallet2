import React, { useEffect, useReducer } from 'react';
import { Layout } from "./Layout";
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { Home } from "./Pages/Home";
import { Sources } from "./Pages/Sources";
import { Loader } from "./Pages/Loader";
import { NodeUp } from './Pages/NodeUp';
import { Receive } from './Pages/Receive';
import { Send } from './Pages/Send';
import { Scan } from './Pages/Scan';
import { Ctx } from "./Context";

// utils
import { initialState, reducer } from "./globalState";

// css
import './App.scss';

import { StateInterface } from './globalTypes';
export const App: React.FC = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState())
  let installPromptFlag = true;
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (event)  => {
      event.preventDefault();
      navigator.registerProtocolHandler('web+lightning', './?tea=%s');
      navigator.registerProtocolHandler('bitcoin', './?tea=%s');
      window.addEventListener("click", () => {
        if(installPromptFlag)
        {
          installPWA(event);
          installPromptFlag = false;
        }
      });
    });
  }, []);
  const installPWA = async (event: any) => {
    if (event !== null) {
      try {
        const { userChoice } = await event.prompt();
      } catch (error) {
        console.log(installPromptFlag);
        
      }
    }
  }

  return (
    <Ctx.Provider value={state}>
      <section className="App">
        <BrowserRouter>
          <Layout dispatch={dispatch}>
            <Routes>
              <Route path="/" element={
                <NodeUp
                  state={state as StateInterface}
                  dispatch={dispatch}
                  ctx={Ctx}
                />
              }/>
              <Route path="/loader" element={
                <Loader
                  state={state as StateInterface}
                  dispatch={dispatch}
                  ctx={Ctx}
                />
              }/>
              <Route path='/sources' element={
                <Sources 
                  state={state as StateInterface}
                  dispatch={dispatch}
                />
              }/>
              <Route path='/home' element={
                <Home 
                  state={state as StateInterface}
                  dispatch={dispatch}
                />
              }/>
              <Route path='/receive' element={
                <Receive 
                  state={state as StateInterface}
                  dispatch={dispatch}
                />
              }/>
              <Route path='/send' element={
                <Send 
                  state={state as StateInterface}
                  dispatch={dispatch}
                />
              }/>
              <Route path='/scan' element={
                <Scan 
                  state={state as StateInterface}
                  dispatch={dispatch}
                />
              }/>
            </Routes>
          </Layout>
        </BrowserRouter>
      </section>
    </Ctx.Provider>
  );
}

export default App;
