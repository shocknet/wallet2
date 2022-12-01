import React, { useState, useEffect } from 'react';
import { ReactSortable } from "react-sortablejs";
import { Button, notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';

import { PageProps } from "../../globalTypes";
import { AddSourceModal } from "../../Components/Modals/AddSourceModal";
import SourceSortDropdown from "../../Components/Dropdowns/SourceSortDropdown";

import { UseModal } from "../../Hooks/UseModal";

import SourceItemMenu from "../../Assets/Icons/source-menu.png";
import EditSource from "../../Assets/Icons/edit-source.svg";

export const Sources: React.FC<PageProps> = (): JSX.Element => {

  const [payToItems, setPayToItems] = useState<Array<any>>([{
    id: 1,
    label: 'biscuitsniffer69@zbd.gg',
    text: "",
    icon: 2,
  } as PayTo,
  {
    id: 4,
    label: "My Home Node",
    text: "33q66w6...",
    icon: 3,
  } as PayTo,
  {
    id: 3,
    label: "Uncle Jim's Node",
    text: "21mz66...",
    icon: 1,
  } as PayTo]);
  const [sendFromItems, setSendFromItems] = useState<Array<any>>([{
    id: 1,
    text: 'biscuitsniffer69@zbd.gg',
    balance: 21212,
    icon: '🔓',
  } as PayTo,
  {
    id: 2,
    text: 'My Home Node (33q66w6...)',
    balance: 10,
    icon: '🏠',
  } as PayTo,
  {
    id: 3,
    text: "Uncle Jim's Node (21mz66...)",
    balance: 615,
    icon: '🫡',
  } as PayTo,
  {
    id: 4,
    text: "Uncle Jim's Node (21mz66...)",
    balance: 3200,
    icon: '🫡',
  } as PayTo]);
  
  const [addSourceLabel, setAddSourceLabel] = useState<string>("");
  const [addSourceOptional, setAddSourceOptional] = useState<string>("");
  const [optionalLabel, setOptionalLabel] = useState<string>("");

  const [modalType, setModalType] = useState<string>("");
  const [showDropDown, setShowDropDown] = useState<string>("");

  const [payToSort, setPayToSort] = useState<string>("TrustLevel");
  const [sendFromSort, setSendFromSort] = useState<string>("TrustLevel");

  const [editSourceId, setEditSourceId] = useState<number>(0);

  const [api, contextHolder] = notification.useNotification();

  const openNotification = (placement: NotificationPlacement, header: string,  text: string) => {
    api.info({
      message: header,
      description:
      text,
      placement
    });
  };

  const { isShown, toggle } = UseModal();

  interface PayTo {
    id?: number;
    text?: any;
    icon?: any;
    balance?: any;
    label?: string;
  }

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
    if(showDropDown)
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
    setAddSourceLabel(payToItems[key].text);
    setOptionalLabel(payToItems[key].icon == 1 ? "It's my node." : (payToItems[key].icon == 2 ? "Very well." : "A little."));
    setAddSourceOptional(payToItems[key].label);
    setModalType("editSource");
    toggle();
  }

  const AddSource = () => {
    if(!addSourceOptional || !optionalLabel)
      return openNotification("top", "Error", "Please Write Data Correctly!");
    setPayToItems([...payToItems, {
      text: addSourceLabel,
      icon: optionalLabel === "A little." ? 3 : (optionalLabel === "Very well." ? 2 : 1),
      label: addSourceOptional
    } as PayTo])
    setOptionalLabel("");
    setAddSourceLabel("");
    setAddSourceOptional("");
    toggle();
  }

  const Edit_Source = () => {
    let payToSources = payToItems;
    if(!addSourceOptional || !optionalLabel)
      return openNotification("top", "Error", "Please Write Data Correctly!")
    payToSources[editSourceId].icon = (optionalLabel == "A little." ? 3 : (optionalLabel == "Very well." ? 2 : 1));
    payToSources[editSourceId].text = addSourceLabel;
    payToSources[editSourceId].label = addSourceOptional;
    setOptionalLabel("");
    setAddSourceLabel("");
    setAddSourceOptional("");
    toggle();
  }

  const Delete_Source = () => {
    let payToSources = payToItems;
    payToSources.splice(editSourceId, 1);
    setEditSourceId(0);
    setPayToItems(payToSources);
    setOptionalLabel("");
    setAddSourceLabel("");
    setAddSourceOptional("");
    toggle();
  }

  const contentAddSource = <React.Fragment>
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
      <div className={`Sources_modal_select_state_column ${optionalLabel == "A little." ? "active" : ""}`} onClick={() => setOptionalLabel("A little.")}>
        <div className="Sources_modal_icon">🔓</div>
        <div className="Sources_modal_input">A little.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optionalLabel == "Very well." ? "active" : ""}`} onClick={() => setOptionalLabel("Very well.")}>
        <div className="Sources_modal_icon">🫡</div>
        <div className="Sources_modal_input">Very well.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optionalLabel == "It's my node." ? "active" : ""}`} onClick={() => setOptionalLabel("It's my node.")}>
        <div className="Sources_modal_icon">🏠</div>
        <div className="Sources_modal_input">It's my node.</div>
      </div>
    </div>
    <div className='Sources_modal_code_discription'>Paste an LNURL or Lightning.Pub</div>
    <div className='Sources_modal_code'>
      <input 
        placeholder="Label..." 
        value={addSourceLabel}
        onChange={(e) => setAddSourceLabel(e.target.value)}
      />
    </div>
    <div className='Sources_modal_optional_labal'>
      <input
        value={addSourceOptional} placeholder="Optional label..." 
        onChange={(e) => setAddSourceOptional(e.target.value)}  
      />
    </div>
    <div className="Sources_modal_add_btn">
      <button onClick={AddSource}>Add</button>
    </div>

  </React.Fragment>;

const contentEditSource = <React.Fragment>
  <div className='Sources_modal_discription'>How well do you trust this node?</div>
  <div className='Sources_modal_select_state'>
    <div className={`Sources_modal_select_state_column ${optionalLabel == "A little." ? "active" : ""}`} onClick={() => setOptionalLabel("A little.")}>
      <div className="Sources_modal_icon">🔓</div>
      <div className="Sources_modal_input">A little.</div>
    </div>
    <div className={`Sources_modal_select_state_column ${optionalLabel == "Very well." ? "active" : ""}`} onClick={() => setOptionalLabel("Very well.")}>
      <div className="Sources_modal_icon">🫡</div>
      <div className="Sources_modal_input">Very well.</div>
    </div>
    <div className={`Sources_modal_select_state_column ${optionalLabel == "It's my node." ? "active" : ""}`} onClick={() => setOptionalLabel("It's my node.")}>
      <div className="Sources_modal_icon">🏠</div>
      <div className="Sources_modal_input">It's my node.</div>
    </div>
  </div>
  <div className='Sources_modal_code'>
    <input 
      placeholder="Label..." 
      value={addSourceLabel}
      onChange={(e) => setAddSourceLabel(e.target.value)}
    />
  </div>
  <div className='Sources_modal_optional_labal'>
    <input
      value={addSourceOptional} placeholder="Optional label..." 
      onChange={(e) => setAddSourceOptional(e.target.value)}  
    />
  </div>
  <div className="Sources_modal_btn_grp">
      <button onClick={Delete_Source}>Delete</button>
      <button onClick={Edit_Source}>Edit</button>
  </div>
  
</React.Fragment>;

  return(
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
          <ReactSortable list={payToItems} setList={setPayToItems}>
            {payToItems.map((item: PayTo, key) => {
              return (
                <div className="Sources_item" key={key}>
                  <div className="Sources_item_left">
                    <div className="Sources_item_icon">{item.icon == 1 ? "🏠" : (item.icon == 2 ? "🫡" : "🔓")}</div>
                    <div className="Sources_item_input">
                      <div>{`${item.label} ${item.text? `(${item.text})` : ""}`}</div>
                    </div>
                  </div>
                  <div className="Sources_item_right">
                    <button className="Sources_item_close" onClick={() => {EditSource_Modal(key)}}>
                      <img src={EditSource} width="15px" alt="" />
                    </button>
                    <button 
                      className="Sources_item_menu" 
                      onClick={(): void => toggleDropDown("PayTo")}
                      onBlur={(e: React.FocusEvent<HTMLButtonElement>): void =>
                        dismissHandler(e)
                      }
                    >
                      <img src={SourceItemMenu} width="23px" alt="" />
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
          <ReactSortable list={sendFromItems} setList={setSendFromItems}>
            {sendFromItems.map((item: PayTo, key) => {
              return (
                <div className="Sources_item" key={key}>
                  <div className="Sources_item_left">
                    <div className="Sources_item_icon">{item.icon}</div>
                    <div className="Sources_item_input">
                      <div>{item.text}</div>
                    </div>
                  </div>
                  <div className="Sources_item_right">
                    <div className="Sources_item_balance">{item.balance}</div>
                    <button className="Sources_item_close">
                      <img src={EditSource} width="15px" alt="" />
                    </button>
                    <button 
                      className="Sources_item_menu" 
                      onClick={(): void => toggleDropDown("SpendFrom")}
                      onBlur={(e: React.FocusEvent<HTMLButtonElement>): void =>
                        dismissHandler(e)
                      }
                    >
                      <img src={SourceItemMenu} width="23px" alt="" />
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
      <AddSourceModal isShown={isShown} hide={toggle} modalContent={modalType === "addSource"? contentAddSource : contentEditSource} headerText={modalType === "addSource"? "Add Source" : "Edit Source"} />
    </div>
  )
}