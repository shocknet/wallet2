import React, { useState, useEffect } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps, ActionType } from "../../globalTypes";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";

export const Loader: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {

  const navigate: NavigateFunction = useNavigate()
  const [opacity, setOpacity] = useState(0.1);
  
  let anim: number = 0;

  useEffect(() => {
    
    const interval = setInterval(() => {
      if(anim > 3)
        navigate("/home");
      if(anim%2){
        setOpacity(0.1);
      }else{
        setOpacity(1);
      }
      anim ++;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return(
    <section className="Loader">
      <div className="Loader_msg">Reticulating splines...</div>
      <div style={{opacity: opacity}} className="Loader_img">
        {Icons.Animation()}
      </div>
    </section>
  )
}
