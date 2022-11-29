import React, { useContext, useState } from "react";

import { MenuList } from "../../Components/Modals/MenuList";
import { UseModal } from "../../Hooks/UseModal";

import Logo from "../../Assets/Images/logo.png";
import Menu from "../../Assets/Icons/menu.svg";
import MenuBack from "../../Assets/Icons/menuBack.svg";
import Setting from "../../Assets/Icons/setting.svg";
import SettingHover from "../../Assets/Icons/setting-hover.svg";
import KeyHover from "../../Assets/Icons/key-hover.svg";
import Key from "../../Assets/Icons/key.svg";

import { HeaderProps } from "./types";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { Ctx } from "../../Context";

import SWText from "../../Assets/Icons/sw_text.png";

export const Header: React.FC<HeaderProps> = (): JSX.Element => {

  const [ menuIcon, setMenuIcon] = useState(Menu);

  const { isShown, toggle } = UseModal();

  const navigate: NavigateFunction = useNavigate()
  const state = useContext(Ctx)

  const isNopeUp: boolean = window.location.pathname === "/";
  const isLoader: boolean = window.location.pathname === "/loader";
  const isscan: boolean = window.location.pathname === "/scan";
  const isreceive: boolean = window.location.pathname === "/receive";

  const content = <React.Fragment>
    <div className="Header_modal">
      <div className="Header_modal_close" onClick={() => toggle()}>
          <img src={MenuBack} width="35px" alt="" />
      </div>
      <div className="Header_modal_content">
        <div className="Header_modal_content_item">
          <div className="Header_modal_content_item_img">
            <img src={Key} width="30px" alt="" />
            <img src={KeyHover} width="30px" alt="" />
          </div>
          <div className="Header_modal_content_item_text">Key Management</div>
        </div>
        <div className="Header_modal_content_item">
          <div className="Header_modal_content_item_img">
            <img src={Setting} width="30px" alt="" />
            <img src={SettingHover} width="30px" alt="" />
          </div>
          <div className="Header_modal_content_item_text">Preferences</div>
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          navigate("/sources");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            <img src={Setting} width="30px" alt="" />
            <img src={SettingHover} width="30px" alt="" />
          </div>
          <div className="Header_modal_content_item_text">Manage Sources</div>
        </div>
      </div>
    </div>
  </React.Fragment>;

  return (
    <header className="Header">
      {(isNopeUp || isLoader) ? (
        <React.Fragment>
          <button className="Header__logo_1" onClick={() => navigate("/home")}>
            <img src={Logo} width="70px" alt="" />
          </button>
          <div className="Header_text">
            <img src={SWText} width="330px" alt="" />
          </div>
        </React.Fragment>
      ) : (
        isscan ? (
          <></>
        ) : (
          isreceive ? (
            <React.Fragment>
              <button className="Header__logo_2" onClick={() => navigate("/home")}>
                <img src={Logo} width="30px" alt="" />
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="Header__logo_2" onClick={() => navigate("/home")}>
                <img src={Logo} width="30px" alt="" />
              </button>
              <button className="Header__menu" onClick={() => {
                navigate("#");
                toggle();
              }}>
                <img src={menuIcon} width="40px" alt="" />
              </button>
              <MenuList isShown={isShown} hide={toggle} modalContent={content} headerText="Add Source" />
            </React.Fragment>
          )
        )
      )}
    </header>
  )
}