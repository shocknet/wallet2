import React, { useEffect, useState } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { useIonRouter } from '@ionic/react';
import * as Icons from "../../Assets/SvgIconLibrary";
import { setPrefs } from '../../State/Slices/prefsSlice';
import axios from 'axios';
import { notification } from 'antd';
import { NotificationPlacement } from 'antd/es/notification/interface';

export const Prefs = () => {
  const router = useIonRouter();
  const dispatch = useDispatch();

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

  const price = useSelector((state:any) => state.usdToBTC);
  //reducer
  const prefsRedux = useSelector((state:any) => state.prefs);

  const [mempool, setMempool] = useState(prefsRedux.mempool||"");
  const [fiat, setFiat] = useState(prefsRedux.fiat||"");

  const hadleSubmit = async () => {
    let mempoolInfo;
    let fiatInfo;
    try {
      mempoolInfo = await axios.get(mempool);
    } catch (error) {
      mempoolInfo = {};
      console.log(error);
    }
    try {
      fiatInfo = await axios.get(fiat);
    } catch (error) {
      fiatInfo = {};
      console.log(error);
    }
    const mempoolBool = (mempool===""||mempoolInfo.data.halfHourFee);
    const fiatBool = (fiat===""||fiatInfo.data.data.amount);
    if (mempoolBool&&fiatBool) {
      dispatch(setPrefs(
        {
          mempool: mempool,
          fiat: fiat,
        }
      ));
      return openNotification("top", "Success", "Successfully saved!");
    }else {
      return openNotification("top", "Error", "Please insert correct endpoint!");
    }
  }

  useEffect(()=>{
  });

  return (
    <div className='Prefs_container'>
      {contextHolder}
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
          <input value={mempool} onChange={(e)=>{setMempool(e.target.value)}} type="text" placeholder="https://mempool.space/api/v1/fees/recommended"/>
        </div>
        <div className='Prefs_fiat'>
          <header>Fiat Estimates</header>
          <div className='Prefs_fiat_estimates'>
            <select className='Prefs_fiat_currency'>
              <option value={"usd"}>USD</option>
              <option value={"eur"}>EUR</option>
              <option value={"cny"}>CNY</option>
            </select>
            <input value={fiat} onChange={(e)=>{setFiat(e.target.value)}} type="text" placeholder="https://api.coinbase.com/v2/prices/BTC-USD/spot"/>
          </div>
        </div>
        <div className='Prefs_buttons'>
          <button className='Prefs_buttons_cancel' onClick={()=>{router.goBack()}}>Cancel</button>
          <button className='Prefs_buttons_save' onClick={hadleSubmit}>Save</button>
        </div>
      </div>
    </div>
  )
}