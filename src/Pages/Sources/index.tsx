import React, { useState } from 'react';
import { ReactSortable } from "react-sortablejs";
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import { ReactQrCode } from '@devmehq/react-qr-code';

import { PageProps } from "../../globalTypes";
import { Modal } from "../../Components/Modals/Modal";
import SourceSortDropdown from "../../Components/Dropdowns/SourceSortDropdown";

//It import modal component
import { UseModal } from "../../Hooks/UseModal";

//It import svg icons library
import * as icons from "../../Assets/SvgIconLibrary";

import { nostr } from '../../Api'
import { NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from '../../constants';
import { questionMark } from '../../Assets/SvgIconLibrary';

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
      icon: 1,
    } as PayTo,
    {
      id: 2,
      label: "Uncle Jim's Node",
      pasteField: "33q66w6...",
      icon: 2,
    } as PayTo,
    {
      id: 3,
      label: "lightning.video",
      pasteField: "21mz66...",
      icon: 3,
    } as PayTo,
    {
      id: 4,
      label: "zbd.gg",
      pasteField: "21mz66...",
      icon: 4,
    } as PayTo,
    {
      id: 5,
      label: "stacker.news",
      pasteField: "21mz66...",
      icon: 5,
    } as PayTo
]);

  /*
    This is Dumy data for display in Send From box
    It include data id, additional field data(pasteField)(string), balance(int), and icon id(string).
  */
  const [sendFromLists, setSendFromLists] = useState<Array<any>>([
    {
      id: 5,
      label: "stacker.news",
      pasteField: "21mz66...",
      icon: 5,
      balance: "615",
    } as SendFrom,
    {
      id: 4,
      label: "zbd.gg",
      pasteField: "21mz66...",
      icon: 4,
      balance: "420,000",
    } as SendFrom,
    {
      id: 3,
      label: "lightning.video",
      pasteField: "21mz66...",
      icon: 3,
      balance: "1,000,000",
    } as SendFrom,
    {
      id: 2,
      label: "Uncle Jim's Node",
      pasteField: "33q66w6...",
      icon: 2,
      balance: "2,100,000",
    } as SendFrom,
    {
      id: 1,
      label: 'My Node',
      pasteField: "",
      icon: 1,
      balance: "10,000,000",
    } as SendFrom,
  ]);

  //Interface for Dumy data for display in Pay To bo
  interface PayTo {
    id?: number;
    label?: string;
    pasteField?: string;
    icon?: number;
  }

  //Interface for Dumy data for display in Send From box
  interface SendFrom {
    id?: number;
    label?: string;
    pasteField?: string;
    icon?: number;
    balance?: string;
  }

  const [sourcePasteField, setSourcePasteField] = useState<string>("");
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [optionalIcon, setOptionalIcon] = useState<string>("");

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

  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState(0)
  const [productId, setProductId] = useState("")

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

  const EditSource_Modal = (key: number) => {
    setEditSourceId(key);
    setSourcePasteField(payToLists[key].pasteField);
    setOptionalIcon(payToLists[key].icon == 1 ? "It's my node." : (payToLists[key].icon == 2 ? "Very well." : "A little."));
    setSourceLabel(payToLists[key].label);
    setModalContent("editSource");
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

      case 'editSource':
        return contentEditContent

      case 'notify':
        return notifyContent
        
      default:
        return notifyContent
    }
  }

  const AddSource = () => {
    if (!sourceLabel || !optionalIcon)
      return openNotification("top", "Error", "Please Write Data Correctly!");
    setpayToLists([...payToLists, {
      text: sourcePasteField,
      icon: optionalIcon === "A little." ? 3 : (optionalIcon === "Very well." ? 2 : 1),
      label: sourceLabel
    } as PayTo])
    setOptionalIcon("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  };

  const Edit_Source = () => {
    let payToSources = payToLists;
    if (!sourceLabel || !optionalIcon)
      return openNotification("top", "Error", "Please Write Data Correctly!")
    payToSources[editSourceId].icon = (optionalIcon == "A little." ? 3 : (optionalIcon == "Very well." ? 2 : 1));
    payToSources[editSourceId].pasteField = sourcePasteField;
    payToSources[editSourceId].label = sourceLabel;
    setOptionalIcon("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  };

  const Delete_Source = () => {
    let payToSources = payToLists;
    payToSources.splice(editSourceId, 1);
    setEditSourceId(0);
    setpayToLists(payToSources);
    setOptionalIcon("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  };

  const arrangeIcon = (value?: number) => {
    switch (value) {
      case 1:
        return icons.mynode()

      case 2:
        return icons.uncle()

      case 3:
        return icons.lightning()

      case 4:
        return icons.zbd()

      case 5:
        return icons.stacker()
          
      default:
        return icons.zbd()
    }
  }

  const contentAddContent = <React.Fragment>
    <div className='Sources_modal_header'>Add Source</div>
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
      <div className={`Sources_modal_select_state_column ${optionalIcon == "A little." ? "active" : ""}`} onClick={() => setOptionalIcon("A little.")}>
        <div className="Sources_modal_input">
          <p>🔓</p>
          A little.
        </div>
      </div>
      <div className={`Sources_modal_select_state_column ${optionalIcon == "Very well." ? "active" : ""}`} onClick={() => setOptionalIcon("Very well.")}>
        <div className="Sources_modal_input">
          <p>🫡</p>
          Very well.
        </div>
      </div>
      <div className={`Sources_modal_select_state_column ${optionalIcon == "It's my node." ? "active" : ""}`} onClick={() => setOptionalIcon("It's my node.")}>
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
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
      <div className={`Sources_modal_select_state_column ${optionalIcon == "A little." ? "active" : ""}`} onClick={() => setOptionalIcon("A little.")}>
        <div className="Sources_modal_icon">🔓</div>
        <div className="Sources_modal_input">A little.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optionalIcon == "Very well." ? "active" : ""}`} onClick={() => setOptionalIcon("Very well.")}>
        <div className="Sources_modal_icon">🫡</div>
        <div className="Sources_modal_input">Very well.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optionalIcon == "It's my node." ? "active" : ""}`} onClick={() => setOptionalIcon("It's my node.")}>
        <div className="Sources_modal_icon">🏠</div>
        <div className="Sources_modal_input">It's my node.</div>
      </div>
    </div>
    <div className='Sources_modal_code'>
      <input
        placeholder="Label..."
        value={sourcePasteField}
        onChange={(e) => setSourcePasteField(e.target.value)}
      />
    </div>
    <div className='Sources_modal_optional_labal'>
      <input
        value={sourceLabel} placeholder="Optional label..."
        onChange={(e) => setSourceLabel(e.target.value)}
      />
    </div>
    <div className="Sources_modal_btn_grp">
      <button onClick={Delete_Source}>Delete</button>
      <button onClick={Edit_Source}>Edit</button>
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
          <div className="Sources_list_box">
            {showDropDown === "PayTo" && (
              <SourceSortDropdown
                cities={PaytoSortLists()}
                showDropDown={false}
                toggleDropDown={(): void => toggleDropDown('PayTo')}
                citySelection={PaytoSortSetting}
              />
            )}
            <ReactSortable list={payToLists} setList={setpayToLists}>
              {payToLists.map((item: PayTo, key) => {
                return (
                  <div className="Sources_item" key={key}>
                    <div className="Sources_item_left">
                      <div className="Sources_item_icon">{arrangeIcon(item.icon)}</div>
                      <div className="Sources_item_input">
                        <div>{item.label}</div>
                      </div>
                    </div>
                    <div className="Sources_item_right">
                      <button className="Sources_item_close" onClick={() => { EditSource_Modal(key) }}>
                        {icons.EditSource()}
                      </button>
                      <button
                        className="Sources_item_menu"
                        onClick={(): void => toggleDropDown("PayTo")}
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
          <div className="Sources_list_box">
            {showDropDown === "SpendFrom" && (
              <SourceSortDropdown
                cities={SpendFromSortLists()}
                showDropDown={false}
                toggleDropDown={(): void => toggleDropDown("SpendFrom")}
                citySelection={SpendFromSortSetting}
              />
            )}
            <ReactSortable list={sendFromLists} setList={setSendFromLists}>
              {sendFromLists.map((item: SendFrom, key) => {
                return (
                  <div className="Sources_item" key={key}>
                    <div className="Sources_item_left">
                      <div className="Sources_item_icon">{arrangeIcon(item.icon)}</div>
                      <div className="Sources_item_input">
                        <div>{item.label}</div>
                      </div>
                    </div>
                    <div className="Sources_item_balance">{item.balance}</div>
                    <div className="Sources_item_right">
                      <button className="Sources_item_close">
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