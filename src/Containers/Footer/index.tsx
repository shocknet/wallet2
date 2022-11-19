import React from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";

import QR from "../../Assets/Icons/QR.svg";
import { HeaderProps } from "./types";

export const Footer: React.FC<HeaderProps> = (): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()

  const isHome: boolean = window.location.pathname === "/home";
  const isSources: boolean = window.location.pathname === "/sources";

  return (
    <header className="Footer">
      {(isHome || isSources) && window.screen.width < 700 ? (
        <React.Fragment>
          <button className="Footer_receive_btn">Receive</button>
          <button className="Footer_send_btn">Send</button>
          <div className="Footer_QR">
            <img src={QR} width="60px" height="60px" alt="" />
          </div>
        </React.Fragment>
      ) : (
        <></>
      )}
    </header>
  )
}