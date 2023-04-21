import React, { useState } from 'react';
import { ReactSortable } from "react-sortablejs";
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import { ReactQrCode } from '@devmehq/react-qr-code';

import { PageProps } from "../../globalTypes";
import { AddSourceModal } from "../../Components/Modals/AddSourceModal";
import SourceSortDropdown from "../../Components/Dropdowns/SourceSortDropdown";

//It import modal component
import { UseModal } from "../../Hooks/UseModal";

//It import svg icons library
import * as icons from "../../Assets/SvgIconLibrary";

import { nostr } from '../../Api'
import { NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from '../../constants';

export const Sources: React.FC<PageProps> = (): JSX.Element => {

  /*
    This is Dumy data for display in Pay To box.
    It include data id(int), Label(string), additional field data(pasteField)(string) and icon id(int).
  */
  const [payToLists, setpayToLists] = useState<Array<any>>([{
    id: 1,
    label: 'biscuitsniffer69@zbd.gg',
    pasteField: "",
    icon: 2,
  } as PayTo,
  {
    id: 4,
    label: "My Home Node",
    pasteField: "33q66w6...",
    icon: 3,
  } as PayTo,
  {
    id: 3,
    label: "Uncle Jim's Node",
    pasteField: "21mz66...",
    icon: 1,
  } as PayTo]);

  /*
    This is Dumy data for display in Send From box
    It include data id, additional field data(pasteField)(string), balance(int), and icon id(string).
  */
  const [sendFromLists, setSendFromLists] = useState<Array<any>>([{
    id: 1,
    pasteField: 'biscuitsniffer69@zbd.gg',
    balance: 21212,
    icon: '🔓',
  } as SendFrom,
  {
    id: 2,
    pasteField: 'My Home Node (33q66w6...)',
    balance: 10,
    icon: '🏠',
  } as SendFrom,
  {
    id: 3,
    pasteField: "Uncle Jim's Node (21mz66...)",
    balance: 615,
    icon: '🫡',
  } as SendFrom,
  {
    id: 4,
    pasteField: "Uncle Jim's Node (21mz66...)",
    balance: 3200,
    icon: '🫡',
  } as SendFrom]);

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
    pasteField?: string;
    icon?: string;
    balance?: number;
  }

  const [sourcePasteField, setSourcePasteField] = useState<string>("");
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [optionalIcon, setOptionalIcon] = useState<string>("");

  const [modalType, setModalType] = useState<string>("");
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

  const AddSource_Modal = () => {
    setModalType("addSource");
    toggle();
  }

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

  const EditSource_Modal = (key: number) => {
    setEditSourceId(key);
    setSourcePasteField(payToLists[key].pasteField);
    setOptionalIcon(payToLists[key].icon == 1 ? "It's my node." : (payToLists[key].icon == 2 ? "Very well." : "A little."));
    setSourceLabel(payToLists[key].label);
    setModalType("editSource");
    toggle();
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
  }

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
  }

  const Delete_Source = () => {
    let payToSources = payToLists;
    payToSources.splice(editSourceId, 1);
    setEditSourceId(0);
    setpayToLists(payToSources);
    setOptionalIcon("");
    setSourcePasteField("");
    setSourceLabel("");
    toggle();
  }

  const contentAddSource = <React.Fragment>
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
    <div className='Sources_modal_code_discription'>Paste an LNURL or Lightning.Pub</div>
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
    <div className="Sources_modal_add_btn">
      <button onClick={AddSource}>Add</button>
    </div>

  </React.Fragment>;

  const contentEditSource = <React.Fragment>
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

  return (
    <div className="Sources">
      {contextHolder}
      <div className="Sources_title">Manage Sources</div>
      <div className="Sources_pay_content">
        <div className="Sources_content_title">Pay To</div>
        <div className="Sources_content_discription">Order of sources from which invoices are generated:</div>
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
                    <div className="Sources_item_icon">{item.icon == 1 ? "🏠" : (item.icon == 2 ? "🫡" : "🔓")}</div>
                    <div className="Sources_item_input">
                      <div>{`${item.label} ${item.pasteField ? `(${item.pasteField})` : ""}`}</div>
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
        <div className="Sources_content_title">Spend From</div>
        <div className="Sources_content_discription">Order of sources from which invoices are paid:</div>
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
                    <div className="Sources_item_icon">{item.icon}</div>
                    <div className="Sources_item_input">
                      <div>{item.pasteField}</div>
                    </div>
                  </div>
                  <div className="Sources_item_right">
                    <div className="Sources_item_balance">{item.balance}</div>
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
      <div className="Sources_add_btn">
        <button onClick={AddSource_Modal}>Add</button>
      </div>
      <AddSourceModal isShown={isShown} hide={toggle} modalContent={modalType === "addSource" ? contentAddSource : contentEditSource} headerText={modalType === "addSource" ? "Add Source" : "Edit Source"} />
      <div>
        <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="product name" />
        <input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.valueAsNumber)} placeholder="product price sats" />
        <button onClick={async () => {
          const res = await nostr.AddProduct({ name: productName, price_sats: productPrice })
          if (res.status !== 'OK') {
            throw new Error(res.reason)
          }
          setProductId(res.id)
        }}
        >CREATE PRODUCT</button>
        {productId && <div>
          <p>The product id is: {productId}</p>
          <ReactQrCode
            style={{ height: "auto", maxWidth: "100%", width: "100%", textAlign: "center", transitionDuration: "500ms" }}
            value={`pub_product:${JSON.stringify({ productId, dest: NOSTR_PUB_DESTINATION, relays: NOSTR_RELAYS })}`}
            size={200}
            renderAs="svg"
          />
        </div>}
      </div>
    </div>
  )
}