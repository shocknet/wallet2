import React, { useReducer } from 'react';
import { Layout } from "./Layout";
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { Home } from "./Pages/Home";
import { ManageSource } from "./Pages/ManageSource";
import { Loader } from "./Pages/Loader";
import { NopeUp } from './Pages/NopeUp';
import { Ctx } from "./Context";

// utils
import { initialState, reducer } from "./globalState";

// css
import './App.scss';
import { StateInterface } from './globalTypes';

function App(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState())

  React.useEffect(() => {
    try{
      fetch('https://fakestoreapi.com/products')
      .then(res => res.json())
      .then(data => dispatch({ type: "ADD_INITIAL_ITEMS", payload: data }))
    }catch(err){
      dispatch({ type: "ERROR" })
    }
  }, [])

  return (
    <Ctx.Provider value={state}>
      <section className="App">
        <BrowserRouter>
          <Layout dispatch={dispatch}>
            <Routes>
              <Route path="/" element={
                <NopeUp
                  state={state as StateInterface}
                  dispatch={dispatch}
                  ctx={Ctx}
                />
              }/>
              <Route path='/manage-source' element={
                <ManageSource 
                  state={state as StateInterface}
                  dispatch={dispatch}
                />
              }/>
              
              <Route path='/sw-home' element={
                <Home
                  state={state as StateInterface}
                  dispatch={dispatch}
                />
              }/>
              <Route path='/loader' element={
                <Loader
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
