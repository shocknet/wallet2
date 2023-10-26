import React, { ChangeEvent, useEffect, useState } from 'react';
import { PageProps } from "../../globalTypes";

import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';
import { saveAs } from 'file-saver';
import { Buffer } from 'buffer';

export const Auth = () => {
  //decode and encode
  const decode = (str: string):string => Buffer.from(str, 'base64').toString('binary');
  const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');

  //reducer
  const spendSources = useSelector((state:any) => state.spendSource).map((e:any)=>{return {...e}});
  const price = useSelector((state:any) => state.usdToBTC);

  const router = useIonRouter();

  const [auth, setAuth] = useState("");
  const [serviceCheck, setServiceCheck] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const send = () => {

  }

  const downloadBackUp = async () => {
    
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)??"null";
      const value = localStorage.getItem(key);
      allData[key] = value;
    }
    
    const saveData = encode(JSON.stringify(allData));
    const blob: Blob = new Blob([saveData], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'shockw.dat');
  }

  const getDatafromBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file: File | undefined = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importBackup(content);
      };
      reader.readAsText(file);
    }
  }

  const importBackup = (content:string) => {
    const data = JSON.parse(decode(content));
    for (let i = 0; i < Object.keys(data).length; i++) {
      const element = Object.keys(data)[i];
      localStorage.setItem(element, data[element])
    }
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
          <input type='file' ref={fileInputRef} onChange={(e)=>{getDatafromBackup(e)}} style={{display: "none"}}/>
          <p onClick={() => fileInputRef.current?.click()}>Import File Backup</p>
        </div>
      </div>
    </div>
  )
}