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
    icon: 2,
  } as PayTo,
  {
    id: 'item1',
    text: 'My Home Node (33q66w6...)',
    icon: 3,
  } as PayTo,
  {
    id: 'item2',
    text: "Uncle Jim's Node (21mz66...)",
    icon: 1,
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
  
  const [addSourceDefaultLabel, setAddSourceDefaultLabel] = useState<string>("lnbc12345678900000000000000");
  const [optionalLabel, setOptionalLabel] = useState<string>("");

  const [editOptionalLabel, setEditOptionalLabel] = useState<string>("");

  const [modalType, setModalType] = useState<string>("");
  const [showDropDown, setShowDropDown] = useState<string>("");

  const [payToSort, setPayToSort] = useState<string>("TrustLevel");
  const [sendFromSort, setSendFromSort] = useState<string>("TrustLevel");

  const [editSourceId, setEditSourceId] = useState<number>(0);

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
    setModalType("editSource");
    toggle();
  }

  const Select_OptionalLabal = (e: string) => {
    setOptionalLabel(e)
  }

  const Select_EditOptionalLabal = (e: string) => {
    setEditOptionalLabel(e)
  }

  const AddSource = () => {
    if(!optionalLabel){
      alert("Please Select Trust Level!");
      return;
    }
    setPayToItems([...payToItems, {
      text: addSourceDefaultLabel,
      icon: optionalLabel === "A little." ? "🔓" : (optionalLabel === "Very well." ? "🫡" : "🏠"),
    } as PayTo])
    setOptionalLabel("");
    toggle();
  }

  const Edit_Source = () => {
    let payToSources = payToItems;
    if(editOptionalLabel)
      payToSources[editSourceId].icon = (editOptionalLabel == "A little." ? 3 : (editOptionalLabel == "Very well." ? 2 : 1));
    setPayToItems(payToSources);
    setEditOptionalLabel("");
    toggle();
  }

  const Delete_Source = () => {
    let payToSources = payToItems;
    payToSources.splice(editSourceId, 1);
    setEditSourceId(0);
    setPayToItems(payToSources);
    setEditOptionalLabel("");
    toggle();
  }

  const contentAddSource = <React.Fragment>
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
    <div className='Sources_modal_code_discription'>Paste an LNURL or Lightning.Pub</div>
    <div className='Sources_modal_code'>lnbc12345678900000000000000</div>
    <div className='Sources_modal_optional_labal'>
      <input type="text" value={optionalLabel} placeholder="Optional label..." />
    </div>
    <div className="Sources_modal_add_btn">
      <button onClick={AddSource}>Add</button>
    </div>

  </React.Fragment>;

const contentEditSource = <React.Fragment>
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
  <div className='Sources_modal_code'>{payToItems[editSourceId] ? payToItems[editSourceId].text : ""}</div>
  <div className='Sources_modal_optional_labal'>
    <input type="text" value={editOptionalLabel || !payToItems[editSourceId] ? editOptionalLabel : payToItems[editSourceId].icon == 1 ? "It's my node." : (payToItems[editSourceId].icon == 2 ? "Very well." : "A little.")} placeholder="Optional label..." />
  </div>
  <div className="Sources_modal_btn_grp">
      <button onClick={Delete_Source}>Delet</button>
      <button onClick={Edit_Source}>Edit</button>
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
          {payToItems.sort((a: PayTo, b: PayTo) => payToSort == "Label" ? String(a.text).toLowerCase() == String(b.text).toLowerCase() ? 0 : (String(a.text).toLowerCase() < String(b.text).toLowerCase() ? -1 : 1): a.icon == b.icon ? 0 : (a.icon < b.icon ? -1 : 1))
          .map((item: PayTo, key) => {
            return (
              <div className="Sources_item" key={key}>
                <div className="Sources_item_left">
                  <div className="Sources_item_icon">{item.icon == 1 ? "🏠" : (item.icon == 2 ? "🫡" : "🔓")}</div>
                  <div className="Sources_item_input">
                    <div>{item.text}</div>
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
          {sendFromItems.sort((a: PayTo, b: PayTo) => sendFromSort == "Label" ? String(a.text).toLowerCase() == String(b.text).toLowerCase() ? 0 : (String(a.text).toLowerCase() < String(b.text).toLowerCase() ? -1 : 1): (sendFromSort == "TrustLevel" ? a.icon == b.icon ? 0 : (a.icon < b.icon ? -1 : 1) : a.icon == b.icon ? 0 : (a.balance < b.balance ? 1 : -1)))
          .map((item: PayTo, key) => {
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
        </div>
      </div>
      <div className="Sources_add_btn">
        <button onClick={AddSource_Modal}>Add</button>
      </div>
      <AddSourceModal isShown={isShown} hide={toggle} modalContent={modalType === "addSource"? contentAddSource : contentEditSource} headerText={modalType === "addSource"? "Add Source" : "Edit Source"} />
    </div>
  )
}