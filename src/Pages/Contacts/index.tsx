import React, { useEffect, useState } from 'react';
import { PageProps } from "../../globalTypes";

import { useSelector, useDispatch } from 'react-redux';
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

export const Contacts = () => {
  const price = useSelector((state:any) => state.usdToBTC);

  //reducer
  const spendSources = useSelector((state:any) => state.spendSource).map((e:any)=>{return {...e}});

  const router = useIonRouter();

  useEffect(()=>{
  });

  return (
    <div className='Send_container'>
      <div className="Send">
        <div className="Send_header_text">Contacts</div>
        <a href='https://google.com'>https</a><br/>
        <a href='bitcoin:bc1923fjo34fjskdjf3q4jgsdj'>bitcoin</a><br/>
        <a href='lightning:lnurl0sd089qudioudfi'>lightning</a><br/>
      </div>
    </div>
  )
}