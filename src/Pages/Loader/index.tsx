import React, { useState, useEffect } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps, ActionType } from "../../globalTypes";
import animation from "../../Assets/Icons/animation.svg";

export const Loader: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {

  const navigate: NavigateFunction = useNavigate()
  const [opacity, setOpacity] = useState(0.1);
  
  let anim: number = 0;

  useEffect(() => {
    
    const interval = setInterval(() => {
      if(anim > 7)
        navigate("/sw-home");
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
    <section className="Loader_Lonic">
      <div className="Loader_Lonic__msg">Reticulating splines...</div>
      <div style={{opacity: opacity}} className="Loader_Lonic__img">
        <img src={animation} alt="" width="35px" />
      </div>
    </section>
  )
}