import { useMemo, useState } from 'react';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector } from '../../State/store';
import { useIonRouter } from '@ionic/react';

export const Automation = () => {

  //reducer
  //const spendSources = useSelector((state) => state.spendSource).map((e: any) => { return { ...e } });
  const activeSubs = useSelector(({ subscriptions }) => subscriptions.activeSubs)
  const inactiveSubs = useSelector(({ subscriptions }) => subscriptions.inactiveSubs)
  const payments = useSelector(({ subscriptions }) => subscriptions.payments)
  const router = useIonRouter();

  const [checked, setChecked] = useState(true);
  const [value, setValue] = useState(1);


  const subscriptionsView = useMemo(() => {
    const paymentEntries = Object.entries(payments)
    return <div>
      <div>
        <h3>Active Subscriptions</h3>
        {activeSubs.length === 0 && "No active subscriptions found"}
        {activeSubs.map(sub => <>
          <p>{sub.subId} - {sub.price.amt}{sub.price.type} every {sub.periodSeconds} seconds, since {sub.subbedAtUnix}</p>
        </>)}
        <h3>Inacive Subscriptions</h3>
        {inactiveSubs.length === 0 && "No inactive subscriptions found"}
        {inactiveSubs.map(sub => <>
          <p>{sub.subId} - {sub.price.amt}{sub.price.type} every {sub.periodSeconds} seconds, since {sub.subbedAtUnix}, until {sub.unsubbedAtUnix} for {sub.unsubReason}</p>
        </>)}
        <h3>Subscriptions Payments</h3>
        {paymentEntries.length === 0 && "No payment entries found"}
        {paymentEntries.map(([subId, subPayments]) => <>
          <h4>{subId} payments</h4>
          {subPayments.length === 0 && "No payment entries found for " + subId}
          {subPayments.map(payment => <>
            <p>{payment.periodNumber} paid {payment.paidSats}sats from {payment.periodStartUnix} to {payment.periodEndUnix}</p>
          </>)}
        </>)}
      </div>
    </div>
  }, [activeSubs, inactiveSubs, payments])

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
              {checked ? Icons.check() : <></>}
            </div>
          </div>
          <span className='Automation_content_desc'>
            Move balances when the cost of doing so is less than %
            <input className='Automation_content_input' type='number' value={value} onChange={(e) => {
              setValue(parseInt(e.target.value))
            }} />
          </span>
        </div>
        <div className='Automation_buttons'>
          <button className='Automation_buttons_cancel' onClick={() => { router.goBack() }}>Cancel</button>
          <button className='Automation_buttons_save' >Save</button>
        </div>
      </div>
      {subscriptionsView}
    </div>
  )
}