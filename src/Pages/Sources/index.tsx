import React, { useEffect, useState } from 'react';
import { ReactSortable } from "react-sortablejs";
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import { PageProps, PayTo, SpendFrom } from "../../globalTypes";
import { Modal } from "../../Components/Modals/Modal";

//It import modal component
import { UseModal } from "../../Hooks/UseModal";

//It import svg icons library
import * as icons from "../../Assets/SvgIconLibrary";
import { questionMark } from '../../Assets/SvgIconLibrary';
import { bech32 } from "bech32";
import axios from 'axios';
import lightningPayReq from "bolt11";
//reducer
import { useSelector, useDispatch } from 'react-redux';
import { addPaySources, editPaySources, deletePaySources, setPaySources } from '../../State/Slices/paySourcesSlice';
import { addSpendSources, editSpendSources, deleteSpendSources, setSpendSources } from '../../State/Slices/spendSourcesSlice';

export const Sources: React.FC<PageProps> = (): JSX.Element => {

  //declaration about reducer
  const dispatch = useDispatch();
  const paySources = useSelector((state:any) => state.paySource).map((e:any)=>{return {...e}});
  
  const spendSources = useSelector((state:any) => state.spendSource).map((e:any)=>{return {...e}});
  
  /*
    This is Source data from reducer
    It include data id, additional field data(pasteField)(string), balance(int), and icon id(string).
  */

  const options: any = {
    little: "A little.",
    very: "Very well.",
    mine: "It's my node.",
  }
 
  const [payToLists, setpayToLists] = useState<PayTo[]>([]);
  const [spendFromLists, setSpendFromLists] = useState<SpendFrom[]>([]);
  const [sourcePasteField, setSourcePasteField] = useState<string>("");
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [optional, setOptional] = useState<string>(options.little);

  const [modalContent, setModalContent] = useState<string>("");

  //This is the state variables what can be used to save sorce id temporarily when edit Source item
  const [editSourceId, setEditSourceId] = useState<number>(0);

  // const [productName, setProductName] = useState("")
  // const [productPrice, setProductPrice] = useState(0)
  // const [productId, setProductId] = useState("")

  /*
    This is part for show notification.
    It is antd notification.
    The value of placement can be "top", "left", "right", "bottom", "header" and "text" can be any string, e.g "error", "Please fill the fields" 
  */
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

  const { isShown, toggle } = UseModal();

  const AddSource_Modal = () => {
    setModalContent("addSource");
    toggle();
  };

  const EditSourcePay_Modal = (key: number) => {
    setEditSourceId(key);    
    setOptional(payToLists[key].option || '');
    setSourceLabel(payToLists[key].label || '');
    setModalContent("editSourcepay");
    toggle();
  };

  const EditSourceSpend_Modal = (key: number) => {
    setEditSourceId(key);    
    setOptional(spendFromLists[key].option || '');
    setSourceLabel(spendFromLists[key].label || '');
    setModalContent("editSourcespend");
    toggle();
  };

  const Notify_Modal = () => {
    setModalContent("notify");
    toggle();
  };

  const switchContent = (value: string) => {
    switch (value) {
      case 'addSource':
        return contentAddContent

      case 'editSourcepay':
        return contentEditContent

      case 'editSourcespend':
        return contentEditContent
  
      case 'notify':
        return notifyContent
        
      default:
        return notifyContent
    }
  }
  
  const requestTag = {
    lnurlPay: "pay",
    lnurlWithdraw: "withdraw",
  }

  const AddSource = async () => {
    if (!sourcePasteField || !optional)
      return openNotification("top", "Error", "Please Write Data Correctly!");
    const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!expression.test(sourcePasteField)) {
      try {
        let { words: dataPart } = bech32.decode(sourcePasteField.replace("lightning:", ""), 2000);
        let sourceURL = bech32.fromWords(dataPart);
        const lnurlLink = Buffer.from(sourceURL).toString()
      } catch (error) {
        return openNotification("top", "Error", "Please Write input Correctly!");
      }
      // lightningPayReq.decode(sourcePasteField.replace("lightning:", ""));
      let { prefix:s, words: dataPart } = bech32.decode(sourcePasteField.replace("lightning:", ""), 2000);
      let sourceURL = bech32.fromWords(dataPart);
      const lnurlLink = Buffer.from(sourceURL).toString()
      
      let resultLnurl = new URL(lnurlLink);
      const parts = resultLnurl.hostname.split(".");
      const sndleveldomain = parts.slice(-2).join('.');
      // const iconLink = await getFavicon(sndleveldomain);
      if (lnurlLink.includes(requestTag.lnurlPay)) {
        const addedSource = {
          id: payToLists.length,
          option: optional,
          icon: sndleveldomain,
          label: resultLnurl.hostname,
          pasteField: sourcePasteField.replaceAll("lightning:", ""),
        } as PayTo;
        setpayToLists([...payToLists, addedSource]);
        dispatch(addPaySources(addedSource))
      }else if (lnurlLink.includes(requestTag.lnurlWithdraw)) {
        let amountSats = "0";
        try {
          const amount = await axios.get(lnurlLink);
          amountSats = (amount.data.maxWithdrawable/1000).toString();
        } catch (error: any) {
          console.log(error);
          return openNotification("top", "Error", error.response.data.reason);
        }
        
        const addedSource = {
          id: spendFromLists.length,
          label: resultLnurl.hostname,
          option: optional,
          icon: sndleveldomain,
          balance: parseInt(amountSats).toString(),
          pasteField: sourcePasteField.replaceAll("lightning:", ""),
        } as SpendFrom;
        setSpendFromLists([...spendFromLists, addedSource]);
        dispatch(addSpendSources(addedSource));
      }
    }else if (expression.test(sourcePasteField)) {
      const lnAddress = sourcePasteField.split("@");
      // const iconLink = await getFavicon(lnAddress[1]);
      const addedSource = {
        id: payToLists.length,
        option: optional,
        icon: lnAddress[1],
        label: sourcePasteField,
        pasteField: sourcePasteField,
      } as PayTo;
      setpayToLists([...payToLists, addedSource]);
      dispatch(addPaySources(addedSource));
    }else {
      return openNotification("top", "Error", "Please Write input Correctly!");
    }
    resetValue();
    toggle();
  };

  const Edit_Pay_Source = () => {
    let payToSources = payToLists;
    if (!sourceLabel || !optional)
      return openNotification("top", "Error", "Please Write Data Correctly!")
    payToSources[editSourceId] = {
      ...payToSources[editSourceId],
      option: optional,
      label: sourceLabel,
    };
    
    setpayToLists(payToSources);
    dispatch(editPaySources(payToLists[editSourceId]))
    resetValue();
    toggle();
  };

  const Edit_Spend_Source = () => {
    let spendFromSources = spendFromLists;
    if (!sourceLabel || !optional)
      return openNotification("top", "Error", "Please Write Data Correctly!")
    spendFromSources[editSourceId] = {
      ...spendFromSources[editSourceId],
      option: optional,
      label: sourceLabel
    }
    setSpendFromLists(spendFromSources);
    dispatch(editSpendSources(spendFromSources[editSourceId]))
    resetValue();
    toggle();
  };

  const Delete_Pay_Source = () => {
    let payToSources = payToLists;
    payToSources.splice(editSourceId, 1);
    setEditSourceId(0);
    setpayToLists(payToSources);
    dispatch(deletePaySources(editSourceId))
    resetValue();
    toggle();
  };

  const Delete_Spend_Source = () => {
    let SpendToSources = spendFromLists;
    SpendToSources.splice(editSourceId, 1);
    setEditSourceId(0);
    setSpendFromLists(SpendToSources);
    dispatch(deleteSpendSources(editSourceId))
    resetValue();
    toggle();
  };

  const resetValue = () => {
    setOptional(options.little);
    setSourcePasteField("");
    setSourceLabel("");
  }

  const arrangeIcon = (value?: string) => {
    switch (value) {
      case "1":
        return icons.mynode()

      case "2":
        return icons.uncle()

      case "3":
        return icons.lightning()

      case "4":
        return icons.zbd()

      case "5":
        return icons.stacker()
          
      default:
        if (!value?.includes("http")) {
          value = "http://www.google.com/s2/favicons?domain="+value;
        }
        return <React.Fragment>
          <img src = {value} width="33px" alt='' style={{borderRadius: "50%"}}/>
        </React.Fragment>
    }
  }

  const getFavicon = async (url: string) => {
    try {
      const {
        data: { icons }
      } = await axios.get(`https://favicongrabber.com/api/grab/${url}`);
      if (icons[0].src !== "") {
        return icons[0].src;
      } else {
        return "nothing";
      }
    } catch (error) {
      return "nothing";
    }
  };

  const contentAddContent = <React.Fragment>
    <div className='Sources_modal_header'>Add Source</div>
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
      <div className={`Sources_modal_select_state_column ${optional === options.little ? "active" : ""}`} onClick={() => setOptional(options.little)}>
        <div className="Sources_modal_input">
          <p>🔓</p>
          A little.
        </div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === options.very ? "active" : ""}`} onClick={() => setOptional(options.very)}>
        <div className="Sources_modal_input">
          <p>🫡</p>
          Very well.
        </div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === options.mine ? "active" : ""}`} onClick={() => setOptional(options.mine)}>
        <div className="Sources_modal_input">
          <p>🏠</p>
          It's my node.
        </div>
      </div>
    </div>
    <div className='Sources_modal_code'>
      <input
        placeholder="Paste an LNURL, Lightning Address, or LP"
        value={sourcePasteField}
        onChange={(e) => setSourcePasteField(e.target.value)}
      />
    </div>
    <div className="Sources_modal_add_btn">
      <button onClick={AddSource}>Add</button>
    </div>

  </React.Fragment>;

  const contentEditContent = <React.Fragment>
    <div className='Sources_modal_header'>Edit Source</div>
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
      <div className={`Sources_modal_select_state_column ${optional === options.little ? "active" : ""}`} onClick={() => setOptional(options.little)}>
        <div className="Sources_modal_icon">🔓</div>
        <div className="Sources_modal_input">A little.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === options.very ? "active" : ""}`} onClick={() => setOptional(options.very)}>
        <div className="Sources_modal_icon">🫡</div>
        <div className="Sources_modal_input">Very well.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === options.mine ? "active" : ""}`} onClick={() => setOptional(options.mine)}>
        <div className="Sources_modal_icon">🏠</div>
        <div className="Sources_modal_input">It's my node.</div>
      </div>
    </div>
    <div className='Sources_modal_code'>
    <input
        value={sourceLabel} placeholder="Optional label..."
        onChange={(e) => setSourceLabel(e.target.value)}
      />
    </div>
    <div className="Sources_modal_add_btn">
      <button onClick={modalContent === "editSourcepay" ? Delete_Pay_Source : Delete_Spend_Source}>Delete</button>
      <button onClick={modalContent === "editSourcepay" ? Edit_Pay_Source : Edit_Spend_Source}>Edit</button>
    </div>

  </React.Fragment>;

  const notifyContent = <React.Fragment>
    <div className="Sources_notify">
      <div className="Sources_notify_title">What is this?</div>
      <div className="Sources_notify_textBox">
        Sources are a node or account used by the wallet. Pay To sources generate invoices to receive payments, and Spend From sources will pay invoices.<br/><br/>
        If using multiple sources, you may set an order that is used to move balances opportunistically, provide liquidity, or second-attempt network failures.
      </div>
      <button className="Sources_notify_button" onClick={toggle}>OK</button>
    </div>
  </React.Fragment>;

  const [scrollPosition, setScrollPosition] = useState(0);

  const handlePayTouchMove = (event:any) => {
    if (event.touches.length === 1) {
      const { clientY } = event.touches[0];
      const deltaY = clientY - scrollPosition;

      // Adjust the scroll position of the specific div element based on touch movement
      const scrollableDiv = document.getElementById('payList');

      // Update the scroll position
      setScrollPosition(clientY);

      if (scrollableDiv) {
        scrollableDiv.scrollTop -= deltaY;
      }
    }
  };

  const handleFromTouchMove = (event:any) => {
    if (event.touches.length === 1) {
      const { clientY } = event.touches[0];
      const deltaY = clientY - scrollPosition;

      // Adjust the scroll position of the specific div element based on touch movement
      const scrollableDiv = document.getElementById('fromList');

      if (scrollableDiv) {
        scrollableDiv.scrollTop -= deltaY;
      }

      // Update the scroll position
      setScrollPosition(clientY);
    }
  };

  const setPosition = (event:any) => {
    const { clientY } = event.touches[0];
    setScrollPosition(clientY);
  }

  const resetSpendFrom = async () => {
    const box = spendSources;
      await box.map(async (e: SpendFrom, i: number) => {
        const element = e;
        const copyElement = {
          id: element.id,
          label: element.label,
          pasteField: element.pasteField,
          icon: element.icon,
          option: element.option,
        }
        let { prefix:s, words: dataPart } = bech32.decode(element.pasteField.replace("lightning:", ""), 2000);
        let sourceURL = bech32.fromWords(dataPart);
        const lnurlLink = Buffer.from(sourceURL).toString()
        let amountSats = "0";
        try {
          const amount = await axios.get(lnurlLink);
          amountSats = (amount.data.maxWithdrawable/1000).toString();
          
          box[i].balance = parseInt(amountSats).toString();
          setSpendFromLists([...box]);
          dispatch(editSpendSources(box[i]));

        } catch (error: any) {
          dispatch(deleteSpendSources(i))
          console.log(error.response.data.reason);
          return openNotification("top", "Error",(i+1) + " " + error.response.data.reason);
        }
        
      });
  }

  useEffect(() => {
    resetSpendFrom();
    setpayToLists(paySources);
    setSpendFromLists(spendSources);
    window.addEventListener("touchstart", setPosition);
  },[]);

  useEffect(() => {
    dispatch(setPaySources(payToLists));
    dispatch(setSpendSources(spendFromLists));
  }, [payToLists, spendFromLists]);

  return (
    <div className="Sources">
      {contextHolder}
      <div className="Sources_title">Manage Sources</div>
      <div>
        <div className="Sources_pay_content">
          <div className="Sources_content_title">
            Pay To
            <button className="Sources_question_mark" onClick={Notify_Modal}>{questionMark()}</button>
          </div>
          <div id='payList' className="Sources_list_box">
            <ReactSortable<PayTo> filter={".Sources_item_left, .Sources_item_close"} list={payToLists.map((e:any)=>{return {...e}})} setList={setpayToLists}>
              {payToLists.map((item: PayTo, key: number) => {
                return (
                  <div className="Sources_item" key={key}>
                    <div className="Sources_item_left" onTouchMove={handlePayTouchMove}>
                      <div className="Sources_item_icon">{arrangeIcon(item.icon)}</div>
                      <div className="Sources_item_input">
                        <div>{item.label}</div>
                      </div>
                    </div>
                    <div className="Sources_item_right">
                      <button className="Sources_item_close" onTouchStart={() => { EditSourcePay_Modal(key) }} onClick={() => { EditSourcePay_Modal(key) }}>
                        {icons.EditSource()}
                      </button>
                      <button className="Sources_item_menu">
                        {icons.SourceItemMenu()}
                      </button>
                    </div>
                  </div>
                )
              })}
            </ReactSortable>
          </div>
        </div>
        <div className="Sources_receive_content">
          <div className="Sources_content_title">
            Spend From
            <button className="Sources_question_mark" onClick={Notify_Modal}>{questionMark()}</button>
          </div>
          <div id='fromList' className="Sources_list_box">
            <ReactSortable filter={".Sources_item_left, .Sources_item_balance, .Sources_item_close"} list={spendFromLists} setList={setSpendFromLists}>
              {spendFromLists.map((item: SpendFrom, key: number) => {
                return (
                  <div className="Sources_item" key={key}>
                    <div className="Sources_item_left" onTouchMove={handleFromTouchMove}>
                      <div className="Sources_item_icon">{arrangeIcon(item.icon)}</div>
                      <div className="Sources_item_input">
                        <div>{item.label}</div>
                      </div>
                    </div>
                    <div className="Sources_item_balance" onTouchMove={handleFromTouchMove}>{item.balance}</div>
                    <div className="Sources_item_right">
                      <button className="Sources_item_close" onTouchStart={() => { EditSourceSpend_Modal(key) }} onClick={() => { EditSourceSpend_Modal(key) }}>
                        {/* <img src={EditSource} width="15px" alt="" /> */}
                        {icons.EditSource()}
                      </button>
                      <button className="Sources_item_menu">
                        {icons.SourceItemMenu()}
                      </button>
                    </div>
                  </div>
                )
              })}
            </ReactSortable>
          </div>
        </div>
      </div>
      <div className="Sources_add_btn">
        <button onClick={AddSource_Modal}>{icons.plusIcon()}ADD</button>
      </div>
      <Modal isShown={isShown} hide={toggle} modalContent={switchContent(modalContent)} headerText={''} />
    </div>
  )
}
