import React, { useEffect, useMemo, useState } from 'react';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useDispatch, useSelector } from '../../State/store';
import Checkbox from '../../Components/Checkbox';
import { arrangeIcon } from '../../jsxHelpers';
import { UseModal } from '../../Hooks/UseModal';
import { Modal } from '../../Components/Modals/Modal';
import { Subscription, addSubPayment, updateActiveSub } from '../../State/Slices/subscriptionsSlice';
import { Destination, InputClassification,parseBitcoinInput } from '../../constants';
import { isAxiosError } from 'axios';
import { v4 as uuid } from "uuid";
import styles from "./styles/modal.module.scss";
import Dropdown from '../../Components/Dropdowns/LVDropdown';
import classNames from 'classnames';
import moment from 'moment';
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";



export enum Interval {
	DAILY = "Daily",
	WEEKLY = "Weekly",
	MONTHLY = "Monthly",
}

const periods = Object.values(Interval);


const getPeriodSeconds = (interval: Interval) => {
	switch(interval) {
		case Interval.DAILY:
			return 24 * 60 * 60;
		case Interval.WEEKLY:
			return 7 * 24 * 60 * 60;
		case Interval.MONTHLY:
			return 32 * 24 * 60 * 60;
	}
}

export const Automation = () => {
  const dispatch = useDispatch();

  //reducer
  //const spendSources = useSelector((state) => state.spendSource).map((e: any) => { return { ...e } });
  const subs = useSelector(({ subscriptions }) => subscriptions.activeSubs)

  const [checked, setChecked] = useState(true);
  const [value, setValue] = useState(1);
  const { isShown, toggle } = UseModal();
  const [editSubId, setEditSubId] = useState("");
  const [inputs, setInputs] = useState({
		memo: "",
		endpoint: "",
		schedule: Interval.MONTHLY,
		enabled: true,
		amount: 0,
    now: true
	});

  useEffect(() => {
    if (editSubId) {
      const sub = subs.find(s => s.subId === editSubId);
      if (sub) {
        setInputs({
					memo: sub.memo,
					endpoint: sub.destionation.data,
					schedule: sub.interval,
					enabled: sub.enabled,
					amount: sub.price.amt,
          now: true
				})
      }
    }
  }, [editSubId])

  const otherOptions = periods.filter(p => p !== inputs.schedule);

  const handleSubmit = async () => {
		if (!inputs.memo || !inputs.endpoint || !inputs.amount) {
			toast.error(<Toast title="Error" message="Please input data correctly." />)
			return;
		}
		let bitcoinInput: Destination | null = null;
		try {
			bitcoinInput = await parseBitcoinInput(inputs.endpoint);
		} catch (err: any) {
			if (isAxiosError(err) && err.response) {
				toast.error(<Toast title="Source Error" message={err.response.data.reason} />)
			} else if (err instanceof Error) {
				toast.error(<Toast title="Source Error" message={err.message} />)
			} else {
				console.log("Unknown error occured", err);
			}
      setEditSubId("")
			toggle();
			return;
		}
		if (
			(bitcoinInput.type !== InputClassification.LNURL && bitcoinInput.lnurlType !== "payRequest")
			&&
			(bitcoinInput.type !== InputClassification.LN_ADDRESS)
		) {
			toast.error(<Toast title="Source Error" message="Invalid recurring payment destination." />)
      setEditSubId("");
			toggle();
			return;
		}
		if (editSubId) {
			const sub = subs.find(s => s.subId === editSubId);
			if (sub) {
				dispatch(updateActiveSub({
					sub: {
						subId: sub.subId,
						periodSeconds: getPeriodSeconds(inputs.schedule),
						subbedAtUnix: sub.subbedAtUnix,
						price: {
							type: "sats",
							amt: inputs.amount
						},
						memo: inputs.memo,
						destionation: bitcoinInput,
						interval: inputs.schedule,
            enabled: inputs.enabled
					}
				}))
        setEditSubId("")
				toggle()
				toast.success(<Toast title="Automation" message="Recurring payments updated." />)
				return;
			}
		}

    const periodSeconds = getPeriodSeconds(inputs.schedule)
    const newSubId = uuid()

		const subObject: Subscription = {
			subId: newSubId,
			periodSeconds: periodSeconds,
			subbedAtUnix: Math.floor(Date.now() / 1000),
			price: {
				type: "sats",
				amt: inputs.amount
			},
			memo: inputs.memo,
			destionation: bitcoinInput,
			interval: inputs.schedule,
      enabled: inputs.enabled
		};
    if (!inputs.now) {
      const nowUnix = Math.floor(Date.now() / 1000);
      dispatch(addSubPayment({
				payment: {
					operationId: "",
					paidSats: 0,
					subId: newSubId,
					periodNumber: 1,
					periodStartUnix: nowUnix + periodSeconds,
					periodEndUnix: nowUnix + 2 * periodSeconds
				}
			}))
    }
		dispatch(updateActiveSub({ sub: subObject }));
		toast.success(<Toast title="Automation" message="Recurring payment added." />)
		toggle();
	}



  const modal = 
    <React.Fragment>
			<div className={styles["modal-header"]}>New Recurring Payment</div>
			<div className={styles["content"]}>
				<div className={styles["input-container"]}>
					<label className={styles["label"]} >Memo:</label>
					<input  value={inputs.memo} onChange={(e) => setInputs(prev => ({ ...prev, memo: e.target.value }))} id="memo" className={classNames(styles["input"], styles["input-element"])} type="text" />
				</div>
				<div className={styles["input-container"]}>
					<label className={styles["label"]} htmlFor="endpoint">Endpoint:</label>
					<input id="endpoint" placeholder="Lnurl or nevent" value={inputs.endpoint} onChange={(e) => setInputs(prev => ({ ...prev, endpoint: e.target.value }))} className={classNames(styles["input"], styles["input-element"])} type="text" />
				</div>
				<div className={styles["input-container"]}>
					<label className={styles["label"]} htmlFor="schedule">Schedule:</label>
					<div className={styles["input"]}>
						<Dropdown<Interval>
							setState={(e) => setInputs(prev => ({ ...prev, schedule: e }))}
							otherOptions={otherOptions}
							jsx={<span style={{display: "flex", alignItems: "center", backgroundColor: "black"}}>{inputs.schedule} {Icons.arrowRight()}</span>}
						/>
					</div>
				</div>
				<div className={styles["input-container"]}>
					<label className={styles["label"]} htmlFor="memo">Next Due:</label>
					<span className={styles["input"]}>{moment((Date.now())).format('YYYY-MM-DD HH:mm')}</span>
				</div>
				<div className={styles["input-container"]}>
					<label className={styles["label"]} htmlFor="enabled">Enabled:</label>
					<label htmlFor="enabled" className={styles["input"]}>
						<Checkbox state={inputs.enabled} setState={(e) => setInputs(prev => ({ ...prev, enabled: e.target.checked }))} id="enabled" />
					</label>
				</div>
				<div className={styles["input-container"]}>
					<label className={styles["label"]} htmlFor="memo">amount:</label>
					<div className={classNames(styles["container"], styles["input"])}>
	
						<input onChange={(e) => setInputs(prev => ({ ...prev, amount: +e.target.value }))} value={inputs.amount || ""} id="send-amount-input" className={styles["input"]} type="number" />
						
					</div>
				</div>
        {
          !editSubId
          &&
          <div className={styles["input-container"]} style={{flexDirection: "column"}}>
            <label className={styles["label"]} htmlFor="now">Make first payment now?</label>
            <label htmlFor="now" className={styles["input"]}>
              <Checkbox state={inputs.now} setState={(e) => setInputs(prev => ({ ...prev, now: e.target.checked }))} id="now" />
            </label>
          </div>
        }
			</div>
			<div className="Sources_modal_add_btn">
				<button onClick={toggle}>Cancel</button>
				<button onClick={handleSubmit}>OK</button>
			</div>
		</React.Fragment>



  const subscriptionsView = useMemo(() => {

    return <div>
      <div className='Automation_content'>
          <div className='Automation_content_title'>
            <span>Recurring Payments</span>
          </div>
          <div className='Automation_content_desc'>
            {
              subs.length === 0
              ?
              <span>No subscriptions found</span>
              :
              <ul>
                {subs.map((item) => {
                  return (
                    <li className="Automation_content_item" key={item.subId}>
                      <div className="Automation_content_item_left">
                        <div className="Automation_content_item_icon">{arrangeIcon(item.destionation.domainName)}</div>
                        <div className="Automation_content_item_input">
                          <span>{item.memo}</span>{ !item.enabled ?  <span className="Automation_content_disabled"></span> : <span className="Automation_content_enabled"></span> }
                        </div>
                      </div>
                      <div className="Automation_content_item_right">
                        <button className="Automation_content_item_close" onClick={() => {
                          setEditSubId(item.subId);
                          toggle()
                        }}>
                          {Icons.EditSource()}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul> 
            }
          </div>
         


{/*           <div className='Automation_content_title'>
              <span>Subscriptions Payments</span>
          </div>
          <div className='Automation_content_desc'>
            {
              paymentEntries.length === 0
              ?
              <span>No payment entries found</span>
              :
              paymentEntries.map(([subId, subPayments]) => <>
                <h4>{subId} payments</h4>
                {subPayments.length === 0 && "No payment entries found for " + subId}
                {subPayments.map(payment => <>
                  <p>{payment.periodNumber} paid {payment.paidSats}sats from {payment.periodStartUnix} to {payment.periodEndUnix}</p>
                </>)}
              </>)
            }
          </div> */}
      </div>
    </div>
  }, [subs, toggle])

  return (
    <div className='Automation_container'>
      <div className="Automation">
        <div className="Automation_header_text">Automation</div>
        <div className='Automation_content'>
          <div className='Automation_content_title'>
            <span>Home Node Rule</span>
            <label htmlFor="home-rule-check">
              <Checkbox id="home-rule-check" state={checked} setState={(e) => setChecked(e.target.checked)} />
            </label>
          </div>
          <span className='Automation_content_desc'>
            Move balances when the cost of doing so is less than %
            <input className='Automation_content_input' type='number' value={value} onChange={(e) => {
				if(parseInt(e.target.value)>100){
					return;
				} else{
					setValue(parseInt(e.target.value))
				}
            }} />
          </span>
        </div>
        {subscriptionsView}
        <div className="Automation_content">
          <div className="Automation_add_button">
            <button onClick={() => toggle()}><span>{Icons.plusIcon()}</span> NEW</button>
          </div>
        </div>
      </div>
      <Modal isShown={isShown} hide={() => {
        setEditSubId("")
        toggle();
      }} modalContent={modal} headerText={''} />
    </div>
  )
}