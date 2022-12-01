import React, { useContext } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";

import QR from "../../Assets/Icons/QR.svg";
import { HeaderProps } from "./types";
import { Ctx } from "../../Context";

export const Footer: React.FC<HeaderProps> = (): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const state = useContext(Ctx)

  const isSources: boolean = window.location.pathname === "/sources";
  const ishome: boolean = window.location.pathname === "/home";
  const receive: boolean = window.location.pathname === "/receive";

  return (
    <footer className="Footer">
      {(isSources || ishome) ? (
        <React.Fragment>
          <div className="Footer_receive_btn">
            <div className="mouseClick_animation Footer_receiveBTN"></div>
            <button onClick={() => { navigate("/receive")} }>Receive</button>
          </div>
          <div className="Footer_send_btn">
            <div className="mouseClick_animation Footer_receiveBTN"></div>
            <button onClick={() => { navigate("/scan")} }>Send</button>
          </div>
          <div className="Footer_QR">
            <div className="mouseClick_animation Footer_QRCodeIcon"></div>
            <img src={QR} width="60px" height="60px" alt="" />
          </div>
        </React.Fragment>
      ) : (
        receive ? (
          <React.Fragment>
            <div className="Footer_QR" onClick={() => { navigate("/scan")} }>
              <div className="mouseClick_animation Footer_QRCodeIcon"></div>
              <img src={QR} width="60px" height="60px" alt="" />
            </div>
          </React.Fragment>
        ) : (
          <></>
        )
      )}
    </footer>
  )
}