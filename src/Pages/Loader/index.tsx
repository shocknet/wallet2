import React, { useState, useEffect } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps, ActionType } from "../../globalTypes";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";

export const Loader: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {

  const navigate: NavigateFunction = useNavigate() 

  useEffect(() => {
    /*
      It is test for redirects page to "Home" page when loaded all require data
      We can change this function with async function after complete this part 
    */
    setTimeout(() => {
      navigate("/home");
    }, 20000);
  }, []);

  return(
    <section className="Loader">
      <div className="Loader_msg">Reticulating splines...</div>
      <div className="Loader_img">
        {Icons.Animation()}
      </div>
    </section>
  )
}
