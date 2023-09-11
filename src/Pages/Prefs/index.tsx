import React, { useEffect, useState } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";

import { useSelector, useDispatch } from 'react-redux';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import axios from 'axios';

type PayInvoice = {
  type: 'payInvoice'
  invoice: string
  amount: number
}
type PayAddress = {
  type: 'payAddress'
  address: string
}

export const Prefs: React.FC<PageProps> = (): JSX.Element => {
  const price = useSelector((state:any) => state.usdToBTC);

  //reducer
  const spendSources = useSelector((state:any) => state.spendSource).map((e:any)=>{return {...e}});


  const navigate: NavigateFunction = useNavigate();

  useEffect(()=>{
  });

  return (
    <div className='Send_container'>
      <div className="Send">
        <div className="Send_header_text">Preferences</div>
        
      </div>
    </div>
  )
}