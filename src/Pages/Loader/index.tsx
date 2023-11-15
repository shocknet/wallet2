import React, { useState, useEffect } from 'react';
import { PageProps, ActionType } from "../../globalTypes";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';

export const Loader = () => {
  const router = useIonRouter();

  useEffect(() => {
    /*
      It is test for redirects page to "Home" page when loaded all require data
      We can change this function with async function after complete this part 
    */
    setTimeout(() => {
      router.push("/home");
    }, 5000);
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
