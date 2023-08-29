import React, { useEffect, useState } from 'react';
import { ReactSortable } from "react-sortablejs";
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import { PageProps } from "../../globalTypes";
import { Modal } from "../../Components/Modals/Modal";
import SourceSortDropdown from "../../Components/Dropdowns/SourceSortDropdown";

//It import modal component
import { UseModal } from "../../Hooks/UseModal";

//It import svg icons library
import * as icons from "../../Assets/SvgIconLibrary";
import { questionMark } from '../../Assets/SvgIconLibrary';
import { bech32 } from "bech32";
import axios from 'axios';

export const Sources: React.FC<PageProps> = (): JSX.Element => {

  /*
    This is Dumy data for display in Pay To box.
    It include data id(int), Label(string), additional field data(pasteField)(string) and icon id(int).
  */
  const [payToLists, setpayToLists] = useState<Array<any>>([
    {
      id: 1,
      label: 'My Node',
      pasteField: "",
      icon: "1",
    } as PayTo,
    {
      id: 2,
      label: "Uncle Jim's Node",
      pasteField: "33q66w6...",
      icon: "2",
    } as PayTo,
    {
      id: 3,
      label: "lightning.video",
      pasteField: "21mz66...",
      icon: "3",
    } as PayTo,
    {
      id: 4,
      label: "zbd.gg",
      pasteField: "21mz66...",
      icon: "4",
    } as PayTo,
    {
      id: 5,
      label: "stacker.news",
      pasteField: "21mz66...",
      icon: "5",
    } as PayTo
]);

  /*
    This is Dumy data for display in Send From box
    It include data id, additional field data(pasteField)(string), balance(int), and icon id(string).
  */
  const [spendFromLists, setSpendFromLists] = useState<Array<any>>([
    {
      id: 5,
      label: "stacker.news",
      pasteField: "21mz66...",
      icon: "5",
      balance: "615",
    } as SendFrom,
    {
      id: 4,
      label: "zbd.gg",
      pasteField: "21mz66...",
      icon: "4",
      balance: "420,000",
    } as SendFrom,
    {
      id: 3,
      label: "lightning.video",
      pasteField: "21mz66...",
      icon: "3",
      balance: "1,000,000",
    } as SendFrom,
    {
      id: 2,
      label: "Uncle Jim's Node",
      pasteField: "33q66w6...",
      icon: "2",
      balance: "2,100,000",
    } as SendFrom,
    {
      id: 1,
      label: 'My Node',
      pasteField: "",
      icon: "1",
      balance: "10,000,000",
    } as SendFrom,
  ]);

  //Interface for Dumy data for display in Pay To bo
  interface PayTo {
    id?: number;
    label?: string;
    pasteField?: string;
    icon?: string;
  }

  //Interface for Dumy data for display in Send From box
  interface SendFrom {
    id?: number;
    label?: string;
    pasteField?: string;
    icon?: string;
    balance?: string;
  }

  const [sourcePasteField, setSourcePasteField] = useState<string>("");
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [optional, setOptional] = useState<string>("");

  const [modalContent, setModalContent] = useState<string>("");
  const [showDropDown, setShowDropDown] = useState<string>("");

  /*
    These are state variables for sort the array of data of Pay To items and Send From items
    The array can be sorted by Label, TrustLavel and Balance
  */
  const [payToSort, setPayToSort] = useState<string>("TrustLevel");
  const [sendFromSort, setSendFromSort] = useState<string>("TrustLevel");

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

  const PaytoSortLists = () => {
    return ["TrustLevel", "Label"];
  };

  const SpendFromSortLists = () => {
    return ["TrustLevel", "Label", "Balance"];
  };

  const toggleDropDown = (list: string) => {
    if (showDropDown)
      setShowDropDown("");
    else
      setShowDropDown(list);
  };

  const SpendFromSortSetting = (item: string): void => {
    setSendFromSort(item);
  };

  const PaytoSortSetting = (item: string): void => {
    setPayToSort(item);
  };

  const dismissHandler = (event: React.FocusEvent<HTMLButtonElement>): void => {
    if (event.currentTarget === event.target) {
      setTimeout(() => {
        setShowDropDown("");
      }, 100);
    }
  };

  const AddSource_Modal = () => {
    setModalContent("addSource");
    toggle();
  };

  const EditSourcePay_Modal = (key: number) => {
    setEditSourceId(key);    
    setOptional(payToLists[key].pasteField);
    setSourceLabel(payToLists[key].label);
    setModalContent("editSourcepay");
    toggle();
  };

  const EditSourceSpend_Modal = (key: number) => {
    setEditSourceId(key);    
    setOptional(spendFromLists[key].pasteField);
    setSourceLabel(spendFromLists[key].label);
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
    lnurlPay: "lnurl-pay",
    lnurlWithdraw: "lnurl-withdraw",
  }

  const AddSource = async () => {
    if (!sourcePasteField || !optional)
      return openNotification("top", "Error", "Please Write Data Correctly!");
    if (sourcePasteField.includes("lnurl")) {
      let { words: dataPart } = bech32.decode(sourcePasteField, 2000);
      let sourceURL = bech32.fromWords(dataPart);
      const lnurlLink = Buffer.from(sourceURL).toString()
      let resultLnurl = new URL(lnurlLink);
      const iconLink = await getFavicon(resultLnurl.host);
      if (lnurlLink.includes(requestTag.lnurlPay)) {
        setpayToLists([...payToLists, {
          id: payToLists.length + 1,
          pasteField: optional,
          icon: iconLink === "nothing" ? resultLnurl.hostname : iconLink,
          label: resultLnurl.hostname
        } as PayTo]);
      }else if (lnurlLink.includes(requestTag.lnurlWithdraw)) {
        setSpendFromLists([...spendFromLists, {
          id: payToLists.length + 1,
          label: resultLnurl.hostname,
          pasteField: optional,
          icon: iconLink === "nothing" ? resultLnurl.hostname : iconLink,
          balance: "0",
        } as SendFrom]);
      }
    }else if (sourcePasteField.includes("@")) {
      const lnAddress = sourcePasteField.split("@");
      const iconLink = await getFavicon(lnAddress[1]);
        setpayToLists([...payToLists, {
          id: payToLists.length + 1,
          pasteField: optional,
          icon: iconLink === "nothing" ? lnAddress[1] : iconLink,
          label: lnAddress[1]
        } as PayTo]);
      // }else if (lnurlLink.includes(requestTag.lnurlWithdraw)) {
      //   setSpendFromLists([...spendFromLists, {
      //     id: payToLists.length + 1,
      //     label: resultLnurl.hostname,
      //     pasteField: optional,
      //     icon: iconLink === "nothing" ? resultLnurl.hostname : iconLink,
      //     balance: "0",
      //   } as SendFrom]);
      // }
    }else {
      return openNotification("top", "Error", "Please Write input Correctly!");
    }
    
    
    setOptional("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  };

  const Edit_Pay_Source = () => {
    let payToSources = payToLists;
    if (!sourceLabel || !optional)
      return openNotification("top", "Error", "Please Write Data Correctly!")
    payToSources[editSourceId].pasteField = optional;
    payToSources[editSourceId].label = sourceLabel;
    setpayToLists(payToSources);
    setOptional("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  };

  const Edit_Spend_Source = () => {
    let spendFromSources = spendFromLists;
    if (!sourceLabel || !optional)
      return openNotification("top", "Error", "Please Write Data Correctly!")
    spendFromSources[editSourceId].pasteField = optional;
    spendFromSources[editSourceId].label = sourceLabel;
    setSpendFromLists(spendFromSources);
    setOptional("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  };

  const Delete_Pay_Source = () => {
    let payToSources = payToLists;
    payToSources.splice(editSourceId, 1);
    setEditSourceId(0);
    setpayToLists(payToSources);
    setOptional("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  };

  const Delete_Spend_Source = () => {
    let SpendToSources = spendFromLists;
    SpendToSources.splice(editSourceId, 1);
    setEditSourceId(0);
    setSpendFromLists(SpendToSources);
    setOptional("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  };

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
      <div className={`Sources_modal_select_state_column ${optional === "A little." ? "active" : ""}`} onClick={() => setOptional("A little.")}>
        <div className="Sources_modal_input">
          <p>🔓</p>
          A little.
        </div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === "Very well." ? "active" : ""}`} onClick={() => setOptional("Very well.")}>
        <div className="Sources_modal_input">
          <p>🫡</p>
          Very well.
        </div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === "It's my node." ? "active" : ""}`} onClick={() => setOptional("It's my node.")}>
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
      <div className={`Sources_modal_select_state_column ${optional === "A little." ? "active" : ""}`} onClick={() => setOptional("A little.")}>
        <div className="Sources_modal_icon">🔓</div>
        <div className="Sources_modal_input">A little.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === "Very well." ? "active" : ""}`} onClick={() => setOptional("Very well.")}>
        <div className="Sources_modal_icon">🫡</div>
        <div className="Sources_modal_input">Very well.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === "It's my node." ? "active" : ""}`} onClick={() => setOptional("It's my node.")}>
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
        Sources are a node or account used by the wallet. Pay To sources generate invoices to receive payments, and Spend From sources will pay invoices<br/><br/>
        If using multiple sources, you may set an order that is used to opportunistically move balances provide liquidity, ot second-attempt network failures.
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

  useEffect(() => {
    window.addEventListener("touchstart", setPosition);
  }, []);

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
            {showDropDown === "PayTo" && (
              <SourceSortDropdown
                cities={PaytoSortLists()}
                showDropDown={false}
                toggleDropDown={(): void => toggleDropDown('PayTo')}
                citySelection={PaytoSortSetting}
              />
            )}
            <ReactSortable filter={".Sources_item_left, .Sources_item_close"} list={payToLists} setList={setpayToLists}>
              {payToLists.map((item: PayTo, key) => {
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
                      <button
                        className="Sources_item_menu"
                        // onClick={(): void => toggleDropDown("PayTo")}
                        onBlur={(e: React.FocusEvent<HTMLButtonElement>): void =>
                          dismissHandler(e)
                        }
                      >
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
            {showDropDown === "SpendFrom" && (
              <SourceSortDropdown
                cities={SpendFromSortLists()}
                showDropDown={false}
                toggleDropDown={(): void => toggleDropDown("SpendFrom")}
                citySelection={SpendFromSortSetting}
              />
            )}
            <ReactSortable filter={".Sources_item_left, .Sources_item_balance, .Sources_item_close"} list={spendFromLists} setList={setSpendFromLists}>
              {spendFromLists.map((item: SendFrom, key) => {
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
                      <button
                        className="Sources_item_menu"
                        onClick={(): void => toggleDropDown("SpendFrom")}
                        onBlur={(e: React.FocusEvent<HTMLButtonElement>): void =>
                          dismissHandler(e)
                        }
                      >
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
      {/* <div>
        {productId && <div>
          <p>The product id is: {productId}</p>
          <ReactQrCode
            style={{ height: "auto", maxWidth: "100%", width: "100%", textAlign: "center", transitionDuration: "500ms" }}
            value={`pub_product:${JSON.stringify({ productId, dest: NOSTR_PUB_DESTINATION, relays: NOSTR_RELAYS })}`}
            size={200}
            renderAs="svg"
          />
        </div>}
      </div> */}
      <Modal isShown={isShown} hide={toggle} modalContent={switchContent(modalContent)} />
    </div>
  )
}