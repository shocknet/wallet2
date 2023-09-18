import React, { useEffect } from "react";
import {  } from "react-router-dom";
import { useIonRouter } from '@ionic/react';
import { useSelector, useDispatch } from 'react-redux';

export const NodeUp = () => {
  const router = useIonRouter();

  //declaration about reducer
  const paySources = useSelector((state:any) => state.paySource).map((e:any)=>{return {...e}});
  
  const spendSources = useSelector((state:any) => state.spendSource).map((e:any)=>{return {...e}});

  const toMainPage = () => {
    const loader = localStorage.getItem("loader");
    if (loader === "true") {
      router.push("/home");
    }else {
      router.push("/loader")
    }
  };

  useEffect(() => {
    if(paySources.length!==0||spendSources.length!==0){
      router.push("/home")
    }
  }, []);

  return(
    <div className="NodeUp">
      <div className="NodeUp_title">Node Up</div>
      <div className="NodeUp_textBox">
        "Continue" to bootstrap the wallet with a trusted server and add a node later<br/><br/><br/>
        "Add connection" to link a node now.
      </div>
      <div className="NodeUp_manual">
        <div onClick={() => { router.push("/sources")} } className="NodeUp_manual_text">
          Add Connection
        </div>
        <div className="NodeUp_manual_btn">
          <button onClick={() => { toMainPage() }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}