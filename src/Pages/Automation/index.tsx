import React, { useEffect, useState } from 'react';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector, useDispatch } from '../../State/store';
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

  const [checked, setChecked] = useState(true);
  const [value, setValue] = useState(1);

  useEffect(() => {
  });

  return (
    <div className='Automation_container'>
      <div className="Automation">
        <div className="Automation_header_text">Automation</div>
        <div className='Automation_content'>
          <div className='Automation_content_title'>
            <span>Home Node Rule</span>
            <div className='Automation_content_title_checkbox' onClick={() => {
              setChecked(!checked)
            }}>
              {checked?Icons.check():<></>}
            </div>
          </div>
          <span className='Automation_content_desc'>
            Move balances when the cost of doing so is less than %
            <input className='Automation_content_input' type='number' value={value} onChange={(e)=>{
              setValue(parseInt(e.target.value))
            }}/>
          </span>
        </div>
        <div className='Automation_buttons'>
          <button className='Automation_buttons_cancel' onClick={() => { router.goBack() }}>Cancel</button>
          <button className='Automation_buttons_save' >Save</button>
        </div>
      </div>
    </div>
  )
}