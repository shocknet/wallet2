import React, { Fragment, useContext, useRef } from "react";
// images and/or icons
import QR from "../../Assets/Icons/QR.svg";
import { HeaderProps } from "./types";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { Ctx } from "../../Context";

export const Footer: React.FC<HeaderProps> = ({ dispatch }): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const state = useContext(Ctx)
  let { current, shoppingCart, history } = state

  const isNopeUp: boolean = window.location.pathname === "/";
  const isLoader: boolean = window.location.pathname === "/loader";

  return (
    <footer className="Footer">
      {(isNopeUp || isLoader) && window.screen.width < 700 ? (
        <React.Fragment>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <button className="Footer_receive_btn">Receive</button>
          <button className="Footer_send_btn">Send</button>
          <div className="Footer_QR">
            <img src={QR} width="60px" height="60px" alt="" />
          </div>
        </React.Fragment>
      )}
    </footer>
  )
}