import React, { useState } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";
import { AddSourceModal } from "../../Components/Modals/AddSourceModal";
import { UseModal } from "../../Hooks/UseModal";

import SourceItemMenu from "../../Assets/Icons/source-menu.png";
import Close from "../../Assets/Icons/close.svg";

export const Sources: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {

  const [itemInput, setItemInput] = useState("");
  const { isShown, toggle } = UseModal();


  const navigate: NavigateFunction = useNavigate()
  const handleClick = () => {
    navigate("/")
  }

  interface payToItemArray {
    [index: number]: object;
  }

  interface PayTo {
    id?: string;
    text?: string;
    icon: String;
  }

  let payToItemArray = [];

  payToItemArray.push({
    id: 'item1',
    tex: 'My Home Node (33q66w6...)',
    icon: '🏠',
  } as PayTo);

  payToItemArray.push({
    id: 'item2',
    tex: "Uncle Jim's Node (21mz66...)",
    icon: '🫡',
  } as PayTo);

  payToItemArray.push({
    id: 'item3',
    tex: 'lightning.video (02346z46...)',
    icon: '🔓',
  } as PayTo);

  payToItemArray.push({
    id: 'item4',
    tex: 'biscuitsniffer69@zbd.gg',
    icon: '🔓',
  } as PayTo);

  payToItemArray.push({
    id: 'item1',
    tex: 'My Home Node (33q66w6...)',
    icon: '🏠',
  } as PayTo);

  payToItemArray.push({
    id: 'item2',
    tex: "Uncle Jim's Node (21mz66...)",
    icon: '🫡',
  } as PayTo);

  payToItemArray.push({
    id: 'item3',
    tex: 'lightning.video (02346z46...)',
    icon: '🔓',
  } as PayTo);

  payToItemArray.push({
    id: 'item4',
    tex: 'biscuitsniffer69@zbd.gg',
    icon: '🔓',
  } as PayTo);

  const content = <React.Fragment>
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
      <div className="Sources_modal_select_state_column">
        <div className="Sources_modal_icon">🔓</div>
        <div className="Sources_modal_input">A little.</div>
      </div>
      <div className="Sources_modal_select_state_column">
        <div className="Sources_modal_icon">🫡</div>
        <div className="Sources_modal_input">Very well.</div>
      </div>
      <div className="Sources_modal_select_state_column">
        <div className="Sources_modal_icon">🏠</div>
        <div className="Sources_modal_input">It's my node.</div>
      </div>
    </div>
    <div className='Sources_modal_code_discription'>Paste an LNURL or Lightning.Pub</div>
    <div className='Sources_modal_code'>lnbc12345678900000000000000</div>
    <div className="Sources_modal_add_btn">
      <button onClick={toggle}>Add</button>
    </div>

  </React.Fragment>;

  return(
    <div className="Sources">
      <div className="Sources_title">Manage Sources</div>
      <div className="Sources_pay_content">
        <div className="Sources_content_title">Pay To</div>
        <div className="Sources_content_discription">Order of sources from which invoices are generated:</div>
        <div className="Sources_list_box">
          {payToItemArray.map((item, key) => {
            return (
              <div className="Sources_item" key={key}>
                <div className="Sources_item_left">
                  <div className="Sources_item_icon">{item.icon}</div>
                  <div className="Sources_item_input">
                    <input
                      type="text"
                      onChange={(e) => setItemInput(e.target.value)}
                      value={itemInput || "My Home Node (33q66w6...)"}
                    />
                  </div>
                </div>
                <div className="Sources_item_right">
                  <div className="Sources_item_close">
                    <img src={Close} width="15px" alt="" />
                  </div>
                  <div className="Sources_item_menu">
                    <img src={SourceItemMenu} width="23px" alt="" />
                  </div>
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
          {payToItemArray.map((item, key) => {
            return (
              <div className="Sources_item" key={key}>
                <div className="Sources_item_left">
                  <div className="Sources_item_icon">{item.icon}</div>
                  <div className="Sources_item_input">
                    <input
                      type="text"
                      onChange={(e) => setItemInput(e.target.value)}
                      value={itemInput || "My Home Node (33q66w6...)"}
                    />
                  </div>
                </div>
                <div className="Sources_item_right">
                  <div className="Sources_item_close">
                    <img src={Close} width="15px" alt="" />
                  </div>
                  <div className="Sources_item_menu">
                    <img src={SourceItemMenu} width="23px" alt="" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="Sources_add_btn">
        <button onClick={toggle}>Add</button>
      </div>
      <AddSourceModal isShown={isShown} hide={toggle} modalContent={content} headerText="Add Source" />
    </div>
  )
}