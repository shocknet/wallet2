import React, { useEffect, useState } from 'react';
import { PageProps } from "../../globalTypes";

import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';

export const Auth = () => {
  const price = useSelector((state:any) => state.usdToBTC);

  //reducer
  const spendSources = useSelector((state:any) => state.spendSource).map((e:any)=>{return {...e}});


  const router = useIonRouter();

  const [auth, setAuth] = useState("");
  const [serviceCheck, setServiceCheck] = useState(false);

  const send = () => {

  }

  const downloadBackUp = () => {
    
  }

  const importBackUp = () => {

  }

  useEffect(()=>{
  });

  return (
    <div className='Auth_container'>
      <div className="Auth">
        <div className="Auth_header_text">Back-Up & Restore</div>
        <div className='Auth_description'>
          <p className='Auth_description_header'>
            Recommended:
          </p>
          <p className='Auth_description_para'>
            Use the built-in <u>storage service</u> to recover your connections in the event your device data gets lost. The 1000 sats a month supports open-source development.
          </p>
        </div>
        <div className='Auth_service' onClick={()=>{setServiceCheck(!serviceCheck)}}>
          <p className='Auth_service_title'>Use Storage Service</p>
          <input checked={serviceCheck} onChange={()=>{setServiceCheck(!serviceCheck)}} className='Auth_service_box' type='checkbox'/>
        </div>
        <div className='Auth_serviceauth'>
          <header>Service Auth</header>
          <input value={auth} onChange={(e)=>{setAuth(e.target.value)}} type="text" placeholder="Your npub or email@address.here"/>
        </div>
        <div className="Auth_auth_send">
            <button onClick={send}>{Icons.send()}SEND</button>
        </div>
        <div className='Auth_border'>
          <p className='Auth_or'>or</p>
        </div>
        <div className='Auth_download'>
          <div className="Auth_download_button">
            <button onClick={downloadBackUp}>
              Download File Backup
            </button>
          </div>
          <p className='Auth_description_para'>
            Note: Be sure to download an updated file after adding or modifying connections.
          </p>
        </div>
        <div className='Auth_border'></div>
        <div className='Auth_import'>
          <p onClick={importBackUp}>Import File Backup</p>
        </div>
      </div>
    </div>
  )
}