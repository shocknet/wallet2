import React, { useContext, useState } from "react";

import { MenuList } from "../../Components/Modals/MenuList";
import { UseModal } from "../../Hooks/UseModal";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";

import SWText from "../../Assets/Images/sw_text.png";

import { HeaderProps } from "./types";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { Ctx } from "../../Context";

export const Header: React.FC<HeaderProps> = (): JSX.Element => {

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
          {Icons.MenuBack()}
      </div>
      <div className="Header_modal_content">
        <div className="Header_modal_content_item">
          <div className="Header_modal_content_item_img">
            {Icons.Key()}
          </div>
          <div className="Header_modal_content_item_text">Key Management</div>
        </div>
        <div className="Header_modal_content_item">
          <div className="Header_modal_content_item_img">
            {Icons.Setting()}
          </div>
          <div className="Header_modal_content_item_text">Preferences</div>
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          navigate("/sources");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.SourceIcon()}
          </div>
          <div className="Header_modal_content_item_text">Manage Sources</div>
        </div>
        <div className="Header_modal_content_item">
          <hr />
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          navigate("/sources");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.BuyCryptoIcon()}
          </div>
          <div className="Header_modal_content_item_text">Buy Bitcoin</div>
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          navigate("/sources");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.HelpAbout()}
          </div>
          <div className="Header_modal_content_item_text">Help/About</div>
        </div>
      </div>
    </div>
  </React.Fragment>;

  return (
    <header className="Header">
      {(isNopeUp || isLoader) ? (
        <React.Fragment>
          <button className="Header_logo_1" onClick={() => navigate("/")}>
            {Icons.Logo()}
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
              <button className="Header_logo_2" onClick={() => navigate("/home")}>
                {Icons.Logo()}
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="Header_logo_2" onClick={() => navigate("/home")}>
                  {Icons.Logo()}
              </button>
              <button className="Header_menu" onClick={() => {
                navigate("#");
                toggle();
              }}>
                {Icons.Menu()}
              </button>
              <MenuList isShown={isShown} hide={toggle} modalContent={content} headerText="Add Source" />
            </React.Fragment>
          )
        )
      )}
    </header>
  )
}