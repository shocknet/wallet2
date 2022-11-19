import React, { useContext } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";

import QR from "../../Assets/Icons/QR.svg";
import { HeaderProps } from "./types";
import { Ctx } from "../../Context";

export const Footer: React.FC<HeaderProps> = ({ dispatch }): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const state = useContext(Ctx)

  const isSources: boolean = window.location.pathname === "/sources";
  const ishome: boolean = window.location.pathname === "/home";

  return (
    <footer className="Footer">
      {(isSources || ishome) ? (
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
    </footer>
  )
}