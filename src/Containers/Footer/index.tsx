import React, { useContext } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { HeaderProps } from "./types";
import { Ctx } from "../../Context";

export const Footer: React.FC<HeaderProps> = (): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const state = useContext(Ctx)

  const isSources: boolean = window.location.pathname === "/sources";
  const ishome: boolean = window.location.pathname === "/home";
  const receive: boolean = window.location.pathname === "/receive";

  return (
    <div>
      {(ishome) ? (
        <React.Fragment>
          <footer className="Footer">
            <div className="Footer_receive_btn">
              <button onClick={() => { navigate("/receive")} }>Receive</button>
            </div>
            <div className="Footer_send_btn">
              <button onClick={() => { navigate("/scan")} }>Send</button>
            </div>
            <div className="Footer_QR" onClick={() => { navigate("/scan")} }>
              {Icons.QR()}
            </div>
          </footer>
        </React.Fragment>
      ) : (
        receive ? (
          <React.Fragment>
            <footer className="Footer">
              <div className="Footer_receive_btn">
                <button onClick={() => { navigate("/home")} }>Cancel</button>
              </div>
              <div className="Footer_send_btn">
                <button onClick={() => { navigate("/home")} }>OK</button>
              </div>
              <div className="Footer_QR" onClick={() => { navigate("/scan")} }>
                {Icons.QR()}
              </div>
            </footer>
          </React.Fragment>
        ) : (
          <></>
        )
      )}
    </div>
  )
}