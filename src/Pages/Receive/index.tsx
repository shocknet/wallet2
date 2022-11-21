import React, { useState } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { ReactQrCode } from '@devmehq/react-qr-code';
import CopyToClipboard from "react-copy-to-clipboard";
import { PageProps } from "../../globalTypes";

import Share from "../../Assets/Icons/Share.svg";

export const Receive: React.FC<PageProps> = (): JSX.Element => {

  const [itemInput, setItemInput] = useState("");
  const [deg, setDeg] = useState("rotate(0deg)");
  const [valueQR, setValueQR] = useState("LNURL123445677888");
  const [vCreateInvoice, setVCreateInvoice] = useState(0);
  const [vReceive, setVReceive] = useState(1);
  const [isCopy, setIsCopy] = useState(false);

  const navigate: NavigateFunction = useNavigate()

  const ChainAdress = () => {
    setValueQR("bc1sdfsdf4w4t4525234234");
    setDeg("rotate(90deg)");
    setIsCopy(false);
  }

  const CreateInvoice = () => {
    setVCreateInvoice(1);
    setVReceive(0);
  }

  const CreateInvoiceOK = () => {
    setVCreateInvoice(0);
    setVReceive(1);
    setDeg("rotate(180deg)");
    setValueQR("lnbc34324242234234234");
    setIsCopy(false);
  }

  const CreateInvoiceCancel = () => {
    setVCreateInvoice(0);
    setVReceive(1);
  }

  return(
    <div>
      <div className="Receive" style={{opacity: vReceive, zIndex: vReceive ? 1000 : -1}}>
        <div className="Receive_QR_text">{valueQR}</div>
        <div className="Receive_QR" style={{transform: deg}}>
          <ReactQrCode 
            style={{ height: "auto", maxWidth: "100%", width: "100%", textAlign: "center", transitionDuration: "500ms" }}
            value={valueQR}
            size={200}
            renderAs="svg"
          />
        </div>
        <div className='Receive_copy'>
          <CopyToClipboard 
            text={valueQR}
            onCopy={() => setIsCopy(true)}
          >
            <span>{isCopy ? "Copied ✔" : "Tap to copy"}</span>
          </CopyToClipboard>
        </div>
        <div className='Receive_share'>
          <img src={Share} alt='' />
        </div>
        <div className='Receive_btn_grp'>
          <div className='Receive_btn_grp_btn'>
            <button onClick={ChainAdress}>Chain-Address</button>&nbsp;🔗
          </div>
          <div className='Receive_btn_grp_btn'>
          ⚡&nbsp;<button onClick={CreateInvoice}>Create Invoice</button>
          </div>
        </div>
      </div>
      <div className='CreateInvoice' style={{opacity: vCreateInvoice, zIndex: vCreateInvoice ? 1000 : -1}}>
        <div className="CreateInvoice_title">Create Invoice</div>
        <div className="CreateInvoice_content">
          <div className="CreateInvoice_content_price">~ $.10</div>
          <div className="CreateInvoice_content_amount">
            <span className="CreateInvoice_content_amount">⚡</span>
            <input
              type="text"
              onChange={(e) => setItemInput(e.target.value)}
              value={itemInput || "Enter amount in sats..."}
            />
          </div>
          <div className="CreateInvoice_content_amount" style={{marginTop: "15px"}}>
            <input
              type="text"
              onChange={(e) => setItemInput(e.target.value)}
              value={itemInput || "Optional memo..."}
            />
          </div>
          <div className="CreateInvoice_content_btn_grp">
            <div className="CreateInvoice_content_btn_grp_item_1">
              <button onClick={CreateInvoiceCancel}>Cancel</button>
            </div>
            <div className="CreateInvoice_content_btn_grp_item_2">
              <button onClick={CreateInvoiceOK}>OK</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}