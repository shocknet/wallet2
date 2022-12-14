import React, { useState } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { ReactQrCode } from '@devmehq/react-qr-code';
import CopyToClipboard from "react-copy-to-clipboard";
import { PageProps } from "../../globalTypes";
import { nostr } from '../../Api'
import Share from "../../Assets/Icons/Share.svg";
import { AddressType } from '../../Api/autogenerated/ts/types';

export const Receive: React.FC<PageProps> = (): JSX.Element => {
  const [error, setError] = useState("")
  const [invoiceAmount, setInvoiceAmount] = useState(0);
  const [invoiceMemo, setInvoiceMemo] = useState("");
  const [deg, setDeg] = useState("rotate(0deg)");
  const [valueQR, setValueQR] = useState("LNURL123445677888");
  const [vCreateInvoice, setVCreateInvoice] = useState(0);
  const [vReceive, setVReceive] = useState(1);
  const [isCopy, setIsCopy] = useState(false);

  const navigate: NavigateFunction = useNavigate()

  const ChainAdress = async () => {
    const res = await nostr.NewAddress({ addressType: AddressType.WITNESS_PUBKEY_HASH })
    if (res.status !== 'OK') {
      setError(res.reason)
      return
    }

    setValueQR(`bitcoin:${res.address}`);
    setDeg("rotate(90deg)");
    setIsCopy(false);
  }

  const CreateInvoice = () => {
    setVCreateInvoice(1);
    setVReceive(0);
  }

  const CreateInvoiceOK = async () => {
    const res = await nostr.NewInvoice({
      amountSats: invoiceAmount,
      memo: invoiceMemo
    })
    if (res.status !== 'OK') {
      setError(res.reason)
      return
    }
    setVCreateInvoice(0);
    setVReceive(1);
    setDeg("rotate(180deg)");
    setValueQR(`lightning:${res.invoice}`);
    setIsCopy(false);
  }

  const CreateInvoiceCancel = () => {
    setVCreateInvoice(0);
    setVReceive(1);
  }

  return (
    <div>
      <div className="Receive" style={{ opacity: vReceive, zIndex: vReceive ? 1000 : -1 }}>
        <div className="Receive_QR_text">{valueQR}</div>
        <div className="Receive_QR" style={{ transform: deg }}>
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
            <span>{isCopy ? "Copied ???" : "Tap to copy"}</span>
          </CopyToClipboard>
        </div>
        <div className='Receive_share'>
          <img src={Share} alt='' />
        </div>
        <div className='Receive_btn_grp'>
          <div className='Receive_btn_grp_btn'>
            <button onClick={ChainAdress}>Chain-Address</button>&nbsp;????
          </div>
          <div className='Receive_btn_grp_btn'>
            ???&nbsp;<button onClick={CreateInvoice}>Create Invoice</button>
          </div>
        </div>
      </div>
      <div className='CreateInvoice' style={{ opacity: vCreateInvoice, zIndex: vCreateInvoice ? 1000 : -1 }}>
        <div className="CreateInvoice_title">Create Invoice</div>
        <div className="CreateInvoice_content">
          <div className="CreateInvoice_content_price">~ $.10</div>
          <div className="CreateInvoice_content_amount">
            <span className="CreateInvoice_content_amount">???</span>
            <input
              type="number"
              placeholder="Enter amount in sats..."
              onChange={(e) => setInvoiceAmount(+e.target.value)}
              value={invoiceAmount ? invoiceAmount : undefined}
            />
          </div>
          <div className="CreateInvoice_content_amount" style={{ marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Optional memo..."
              onChange={(e) => setInvoiceMemo(e.target.value)}
              value={invoiceMemo ? invoiceMemo : undefined}
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