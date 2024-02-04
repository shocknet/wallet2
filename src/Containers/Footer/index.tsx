import React, { useContext } from "react";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { HeaderProps } from "./types";
import { Ctx } from "../../Context";
import { useIonRouter } from "@ionic/react";

export const Footer = () => {
  const router = useIonRouter();
  const state = useContext(Ctx)

  const isSources: boolean = router.routeInfo.pathname === "/sources";
  const ishome: boolean = router.routeInfo.pathname === "/home";
  const receive: boolean = router.routeInfo.pathname === "/receive";

  return (
    <div>
      {(ishome) ? (
        <React.Fragment>
          <footer className="Footer">
            <div className="Footer_receive_btn">
              <button onClick={() => { router.push("/receive") }}>Receive</button>
            </div>
            <div className="Footer_send_btn">
              <button onClick={() => { router.push("/send") }}>Send</button>
            </div>
            <div className="Footer_QR" onClick={() => { router.push("/scan") }}>
              {Icons.QR()}
            </div>
          </footer>
        </React.Fragment>
      ) : (
        receive ? (
          <React.Fragment>
            <footer className="Footer">
              <div className="Footer_receive_btn">
                <button onClick={() => { router.push("/home") }}>Cancel</button>
              </div>
              <div className="Footer_send_btn">
                <button onClick={() => { router.push("/home") }}>OK</button>
              </div>
              <div className="Footer_QR" onClick={() => { router.push("/scan") }}>
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