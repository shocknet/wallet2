import React, { useReducer } from 'react';
import { Layout } from "./Layout";
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { Home } from "./Pages/Home";
import { Sources } from "./Pages/Sources";
import { Loader } from "./Pages/Loader";
import { NodeUp } from './Pages/NodeUp';
import { Receive } from './Pages/Receive';
import { Scan } from './Pages/Scan';
import { Ctx } from "./Context";

// utils
import { initialState, reducer } from "./globalState";

// css
import './App.scss';
import { StateInterface } from './globalTypes';

function App(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState())

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
