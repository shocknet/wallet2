import React, { useState, useEffect } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";
import { AddSourceModal } from "../../Components/Modals/AddSourceModal";
import SourceSortDropdown from "../../Components/Dropdowns/SourceSortDropdown";

import { UseModal } from "../../Hooks/UseModal";

import SourceItemMenu from "../../Assets/Icons/source-menu.png";
import EditSource from "../../Assets/Icons/edit-source.svg";

export const Sources: React.FC<PageProps> = (): JSX.Element => {

  const [itemInput, setItemInput] = useState<string>("");
  const [payToItems, setPayToItems] = useState([{
    id: 'item4',
    text: 'biscuitsniffer69@zbd.gg',
    icon: '🔓',
  } as PayTo,
  {
    id: 'item1',
    text: 'My Home Node (33q66w6...)',
    icon: '🏠',
  } as PayTo,
  {
    id: 'item2',
    text: "Uncle Jim's Node (21mz66...)",
    icon: '🫡',
  } as PayTo]);
  const [sendFromItems, setSendFromItems] = useState([{
    id: 'item4',
    text: 'biscuitsniffer69@zbd.gg',
    balance: 21212,
    icon: '🔓',
  } as PayTo,
  {
    id: 'item1',
    text: 'My Home Node (33q66w6...)',
    balance: 10,
    icon: '🏠',
  } as PayTo,
  {
    id: 'item2',
    text: "Uncle Jim's Node (21mz66...)",
    balance: 615,
    icon: '🫡',
  } as PayTo,
  {
    id: 'item2',
    text: "Uncle Jim's Node (21mz66...)",
    balance: 3200,
    icon: '🫡',
  } as PayTo]);
  const [modalType, setModalType] = useState<string>("");
  const [optionalLabel, setOptionalLabel] = useState<string>("");
  const [editOptionalLabel, setEditOptionalLabel] = useState<string>("");
  const [showDropDown, setShowDropDown] = useState<string>("");
  const [payToSort, setPayToSort] = useState<string>("");
  const [sendFromSort, setSendFromSort] = useState<string>("");

  const { isShown, toggle } = UseModal();

  interface PayTo {
    id?: any;
    text?: any;
    icon?: any;
    balance?: any;
  }

  const AddSource_Modal = () => {
    setModalType("addSource");
    toggle();
  }

  const navigate: NavigateFunction = useNavigate()
  const handleClick = () => {
    navigate("/")
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
    let sendFromsources = sendFromItems;
    if(item === "TrustLevel"){
      sendFromsources.sort((a: PayTo, b: PayTo) => {
        let x = String(a.icon).toLowerCase();
        let y = String(b.icon).toLowerCase();
        if (x < y) {return 1;}
        if (x > y) {return -1;}
        return 0;
      });
    }
    else if(item === "Label"){
      sendFromsources.sort((a: PayTo, b: PayTo) => {
        let x = String(a.text).toLowerCase();
        let y = String(b.text).toLowerCase();
        if (x < y) {return -1;}
        if (x > y) {return 1;}
        return 0;
      });
    }
    else if(item === "Balance"){
      sendFromsources.sort((a: PayTo, b: PayTo) => {
        let x = a.balance;
        let y = b.balance;
        if (x < y) {return 1;}
        if (x > y) {return -1;}
        return 0;
      });
    }
    setSendFromItems(sendFromsources)
    setSendFromSort(item);
  };

  const PaytoSortSetting = (item: string): void => {
    let PayTosources = payToItems;

    if(item === "TrustLevel"){
      PayTosources.sort((a: PayTo, b: PayTo) => {
        let x = String(a.icon).toLowerCase();
        let y = String(b.icon).toLowerCase();
        if (x < y) {return 1;}
        if (x > y) {return -1;}
        return 0;
      });
    }
    else if(item === "Label"){
      PayTosources.sort((a: PayTo, b: PayTo) => {
        let x = String(a.text).toLowerCase();
        let y = String(b.text).toLowerCase();
        if (x < y) {return -1;}
        if (x > y) {return 1;}
        return 0;
      });
    }
    setPayToItems(PayTosources)
    setPayToSort(item);
  };

  const dismissHandler = (event: React.FocusEvent<HTMLButtonElement>): void => {
    if (event.currentTarget === event.target) {
      setTimeout(() => {
        setShowDropDown("");
      }, 100);
    }
  };

  const EditSource_Modal = () => {
    setModalType("editSource");
    toggle();
  }

  const Select_OptionalLabal = (e: string) => {
    setOptionalLabel(e)
  }

  const Select_EditOptionalLabal = (e: string) => {
    setEditOptionalLabel(e)
  }

  const contentAddSource = <React.Fragment>
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
    <div className="Sources_modal_select_state_column" onClick={() => Select_EditOptionalLabal("A little.")}>
      <div className="Sources_modal_icon">🔓</div>
      <div className="Sources_modal_input">A little.</div>
    </div>
    <div className="Sources_modal_select_state_column" onClick={() => Select_EditOptionalLabal("Very well.")}>
      <div className="Sources_modal_icon">🫡</div>
      <div className="Sources_modal_input">Very well.</div>
    </div>
    <div className="Sources_modal_select_state_column" onClick={() => Select_EditOptionalLabal("It's my node.")}>
      <div className="Sources_modal_icon">🏠</div>
      <div className="Sources_modal_input">It's my node.</div>
    </div>
  </div>
    <div className='Sources_modal_code_discription'>Paste an LNURL or Lightning.Pub</div>
    <div className='Sources_modal_code'>lnbc12345678900000000000000</div>
    <div className='Sources_modal_optional_labal'>
      <input type="text" value={editOptionalLabel} placeholder="Optional label..." />
    </div>
    <div className="Sources_modal_add_btn">
      <button onClick={toggle}>Add</button>
    </div>

  </React.Fragment>;

const contentEditSource = <React.Fragment>
  <div className='Sources_modal_discription'>How well do you trust this node?</div>
  <div className='Sources_modal_select_state'>
    <div className="Sources_modal_select_state_column" onClick={() => Select_OptionalLabal("A little.")}>
      <div className="Sources_modal_icon">🔓</div>
      <div className="Sources_modal_input">A little.</div>
    </div>
    <div className="Sources_modal_select_state_column" onClick={() => Select_OptionalLabal("Very well.")}>
      <div className="Sources_modal_icon">🫡</div>
      <div className="Sources_modal_input">Very well.</div>
    </div>
    <div className="Sources_modal_select_state_column" onClick={() => Select_OptionalLabal("It's my node.")}>
      <div className="Sources_modal_icon">🏠</div>
      <div className="Sources_modal_input">It's my node.</div>
    </div>
  </div>
  <div className='Sources_modal_code'>lnbc12345678900000000000000</div>
  <div className='Sources_modal_optional_labal'>
    <input type="text" value={optionalLabel} placeholder="Optional label..." />
  </div>
  <div className="Sources_modal_btn_grp">
      <button onClick={toggle}>Delet</button>
      <button onClick={toggle}>Edit</button>
  </div>
  
</React.Fragment>;

  return(
    <div className="Sources">
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
          {payToItems.map((item: PayTo, key) => {
            return (
              <div className="Sources_item" key={key}>
                <div className="Sources_item_left">
                  <div className="Sources_item_icon">{item.icon}</div>
                  <div className="Sources_item_input">
                    <div>{item.text}</div>
                  </div>
                </div>
                <div className="Sources_item_right">
                  <button className="Sources_item_close" onClick={EditSource_Modal}>
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
                  <button className="Sources_item_close" onClick={EditSource_Modal}>
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
        </div>
      </div>
      <div className="Sources_add_btn">
        <button onClick={AddSource_Modal}>Add</button>
      </div>
      <AddSourceModal isShown={isShown} hide={toggle} modalContent={modalType === "addSource"? contentAddSource : contentEditSource} headerText={modalType === "addSource"? "Add Source" : "Edit Source"} />
    </div>
  )
}