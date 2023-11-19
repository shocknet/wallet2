import React, { useEffect, useState } from 'react';
import { PageProps } from "../../globalTypes";

import { useSelector, useDispatch } from '../../State/store';
import axios from 'axios';
import { useIonRouter } from '@ionic/react';

type PayInvoice = {
  type: 'payInvoice'
  invoice: string
  amount: number
}
type PayAddress = {
  type: 'payAddress'
  address: string
}

export const Automation = () => {

  //reducer
  const spendSources = useSelector((state) => state.spendSource).map((e: any) => { return { ...e } });


  const router = useIonRouter();

  useEffect(() => {
  });

  return (
    <div className='Send_container'>
      <div className="Send">
        <div className="Send_header_text">Automation</div>

      </div>
    </div>
  )
}