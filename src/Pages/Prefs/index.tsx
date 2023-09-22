import React, { useEffect, useState } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { useIonRouter } from '@ionic/react';
import * as Icons from "../../Assets/SvgIconLibrary";

export const Prefs = () => {
  const price = useSelector((state:any) => state.usdToBTC);

  //reducer
  const spendSources = useSelector((state:any) => state.spendSource).map((e:any)=>{return {...e}});


  const router = useIonRouter();

  useEffect(()=>{
  });

  return (
    <div className='Prefs_container'>
      <div className="Prefs">
        <div className="Prefs_header_text">Preferences</div>
        <div className="Prefs_chainfee">
          <header>Default Chain Fee</header>
          <div className='Prefs_chainfee_options'>
            <div className='Prefs_chainfee_options_first'>
              <p className='Prefs_chainfee_options_top'>Economy</p>
              <p className='Prefs_chainfee_options_bottom'>10 sat/byte</p>
            </div>
            <div className='Prefs_chainfee_options_second'>
              <p className='Prefs_chainfee_options_top'>Average</p>
              <p className='Prefs_chainfee_options_bottom'>30 sat/byte</p>
            </div>
            <div className='Prefs_chainfee_options_third'>
              <p className='Prefs_chainfee_options_top'>ASAP</p>
              <p className='Prefs_chainfee_options_bottom'>60 sat/byte</p>
            </div>
          </div>
          <div className='Prefs_chainfee_settings'>
            {Icons.prefsSetting()}
          </div>
        </div>
        <div className='Prefs_mempool'>
          <header>Mempool Provider</header>
          <input type="text" placeholder="Invoice, Bitcoin or Lightning Address, nPub, Email"/>
        </div>
        <div className='Prefs_fiat'>
          <header>Fiat Estimates</header>
          <div className='Prefs_fiat_estimates'>
            <select className='Prefs_fiat_currency'>
              <option value={"usd"}>USD</option>
              <option value={"eur"}>EUR</option>
              <option value={"cny"}>CNY</option>
            </select>
            <input type="text" placeholder="Invoice, Bitcoin or Lightning Address, nPub, Email"/>
          </div>
        </div>
        <div className='Prefs_buttons'>
          <button className='Prefs_buttons_cancel'>Cancel</button>
          <button className='Prefs_buttons_save'>Save</button>
        </div>
      </div>
    </div>
  )
}