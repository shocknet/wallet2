import React, { useEffect, useState } from 'react';

import { useSelector, useDispatch } from '../../State/store';
import { useIonRouter } from '@ionic/react';
import * as Icons from "../../Assets/SvgIconLibrary";
import { setPrefs } from '../../State/Slices/prefsSlice';
import axios from 'axios';
import { notification } from 'antd';
import { NotificationPlacement } from 'antd/es/notification/interface';
import { defaultMempool } from '../../constants';

interface ChainFeesInter {
  fastestFee: number,
  halfHourFee: number,
  hourFee: number,
  economyFee: number,
  minimumFee: number,
}

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

  //reducer
  const prefsRedux = useSelector((state:any) => state.prefs);

  const screenWidth = window.innerWidth * 0.88 - 23;

  const [mempool, setMempool] = useState(prefsRedux.mempool||"");
  const [fiat, setFiat] = useState(prefsRedux.fiat||"");
  const [chainFees, setChainFees] = useState<ChainFeesInter>({
    fastestFee: 0,
    halfHourFee: 0,
    hourFee: 0,
    economyFee: 0,
    minimumFee: 0,
  });
  const [chainFee, setChainFee] = useState(prefsRedux.chainFee??1);
  const [pos, setPos] = useState(0);
  const [click, setClick] = useState(false);

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
          chainFee: chainFee
        }
      ));
      return openNotification("top", "Success", "Successfully saved!");
    }else {
      return openNotification("top", "Error", "Please insert correct endpoint!");
    }
  }

  useEffect(()=>{
    switch (chainFee) {
      case 0:
        setPos(23)
        break;

      case 1:
        setPos(screenWidth/2)
        break;

      case 2:
        setPos(screenWidth-23)
        break;
    }
    getChainFee();
  },[prefsRedux]);

  useEffect(()=>{
    window.addEventListener("mouseup", ()=>{
      // touchEndSlide();
    })
  },[])

  const getChainFee = async () => {
    if (prefsRedux.mempool === "") {
      const defaultFee = await axios.get(defaultMempool);
      setChainFees(defaultFee.data)
      return;
    }
    const getFee = await axios.get(prefsRedux.mempool);
    setChainFees(getFee.data);
  }

  const touchMoveSlide = (e: any) => {
    let positionX = 0;
    if (e.type.includes("mouse")) {
      positionX = e.pageX - window.innerWidth * 0.06 - 12;
      if (!click) {
        return;
      }
    }else if (e.type.includes("touch")) {
      positionX = e.changedTouches[0].clientX - window.innerWidth * 0.06 - 12;
    }
    if (positionX<0) {
      positionX = 0;
    }
    if (positionX>window.innerWidth * 0.88 - 23) {
      positionX = window.innerWidth * 0.88 - 23;
    }
    setPos(positionX);
  }

  const touchEndSlide = () => {
    const feeValue = pos*2/screenWidth;
    switch (Math.round(feeValue)) {
      case 0:
        setPos(23)
        break;

      case 1:
        setPos(screenWidth/2)
        break;

      case 2:
        setPos(screenWidth-23)
        break;
    }
    setChainFee(Math.round(feeValue));
    setClick(false);
  }

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
              <p className='Prefs_chainfee_options_bottom'>{chainFees.economyFee} sat/byte</p>
            </div>
            <div className='Prefs_chainfee_options_second'>
              <p className='Prefs_chainfee_options_top'>Average</p>
              <p className='Prefs_chainfee_options_bottom'>{chainFees.hourFee} sat/byte</p>
            </div>
            <div className='Prefs_chainfee_options_third'>
              <p className='Prefs_chainfee_options_top'>ASAP</p>
              <p className='Prefs_chainfee_options_bottom'>{chainFees.halfHourFee} sat/byte</p>
            </div>
          </div>
          <div className='Prefs_chainfee_settings'>
            <div 
              onTouchStart={touchMoveSlide}
              onTouchMove={touchMoveSlide}
              onTouchEnd={touchEndSlide}
              onMouseDown={()=>{setClick(true)}}
              onMouseMove={touchMoveSlide}
              onMouseLeave={touchEndSlide}
              onMouseUp={touchEndSlide}
              style={{paddingLeft: pos, transition: "0.15s"}}
            >
              {Icons.prefsSetting()}
            </div>
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