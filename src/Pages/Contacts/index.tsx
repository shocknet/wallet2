// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PageProps } from "../../globalTypes";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useSelector, useDispatch } from '../../State/store';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios from 'axios';
import { useIonRouter } from '@ionic/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PayInvoice = {
  type: 'payInvoice'
  invoice: string
  amount: number
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PayAddress = {
  type: 'payAddress'
  address: string
}

export const Contacts = () => {

  //reducer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const spendSources = useSelector((state: any) => state.spendSource).map((e: any) => { return { ...e } });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useIonRouter();

  useEffect(() => {
  });

  return (
    <div className='Send_container'>
      <div className="Send">
        <div className="Send_header_text">Contacts</div>
      </div>
    </div>
  )
}