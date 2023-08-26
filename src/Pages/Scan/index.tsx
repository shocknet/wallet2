import React, { useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { QrReader } from "react-qr-reader";
import { PageProps } from "../../globalTypes";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { bech32 } from "bech32";
import { nostr } from '../../Api';
import { request } from "http";
type PayInvoice = {
  type: 'payInvoice'
  invoice: string
  amount: number
}
type PayAddress = {
  type: 'payAddress'
  address: string
}

export const Scan: React.FC<PageProps> = (): JSX.Element => {

  const navigate: NavigateFunction = useNavigate();

  const [itemInput, setItemInput] = useState("");
  const [error, setError] = useState("");
  const [payOperation, setPayOperation] = useState<PayInvoice | PayAddress | null>(null)
  const [amountToPay, setAmountToPay] = useState(0)

  const parse = async (input: string) => {
    console.log("parsing")
    setError("");
    const lowData = input.toLowerCase()
    if (lowData.startsWith('pub_product:')) {
      console.log("parsed pub product", lowData)
      const productData = JSON.parse(lowData.slice('pub_product:'.length))
      const productId = productData.productId

      console.log("send the buy request to the following pub:", productData.dest)
      console.log("send the buy request using the following relays:", productData.relays)

      const invoiceRes = await nostr.NewProductInvoice({ id: productId })
      if (invoiceRes.status !== 'OK') {
        setError(invoiceRes.reason)
        return
      }
      const decodedRes = await nostr.DecodeInvoice({ invoice: invoiceRes.invoice })
      if (decodedRes.status !== 'OK') {
        setError(decodedRes.reason)
        return
      }
      setPayOperation({
        type: 'payInvoice',
        invoice: invoiceRes.invoice,
        amount: decodedRes.amount
      })
    } else if (lowData.startsWith('bitcoin:')) {
      const btcAddress = lowData.slice('bitcoin:'.length)
      setPayOperation({
        type: 'payAddress',
        address: btcAddress
      })
    } else if (lowData.startsWith('lightning:')) {
      const lnOperation = lowData.slice('lightning:'.length)
      if (lnOperation.startsWith("lnurl")) {
        setError("lnurl not supported yet" + lnOperation)
      } else {
        const res = await nostr.DecodeInvoice({ invoice: lnOperation })
        if (res.status !== 'OK') {
          setError(res.reason)
          return
        }
        setPayOperation({
          type: 'payInvoice',
          invoice: lnOperation,
          amount: res.amount
        })
      }
    } else {
      setError("scanned content unsupported " + lowData)
    }
  }

  const requestTag = {
    lnurlPay: "payRequest",
    lnurlWithdraw: "withdrawRequest",
    lnurlAuth: "",
    lnurlChannel: "channelRequest",
  }

  const handleSubmit = async (qrcode: string) => {
    let { prefix: hrp, words: dataPart } = bech32.decode(qrcode, 2000)
    let requestByteArray = bech32.fromWords(dataPart)

    let resultLnurl = Buffer.from(requestByteArray).toString();
    console.log(resultLnurl);
    
    fetch(resultLnurl).then((resInvoice: any) => {
      return resInvoice.json()
    }).then(invoiceData => {
      console.log(invoiceData.tag, "metaData");

      
    }).catch(error => {
      // Handle any errors
      console.error(error);
    });
  }

  const pay = async (action: PayInvoice | PayAddress) => {
    switch (action.type) {
      case 'payAddress':
        const resA = await nostr.PayAddress({
          address: action.address,
          amoutSats: amountToPay,
          targetConf: 10
        })
        if (resA.status !== 'OK') {
          setError(resA.reason)
          return
        }
        navigate("/home")
        break;
      case 'payInvoice':
        const resI = await nostr.PayInvoice({
          invoice: action.invoice,
          amount: 0,
        })
        if (resI.status !== 'OK') {
          setError(resI.reason)
          return
        }
        navigate("/home")
        break;
    }
  }

  if (error !== '') {
    return <div className="Scan_error">
      <div className="Scan_error_img">
        {Icons.ErrorMessage()}
      </div>
      <div className="Scan_error_text">{error}</div>
    </div>;
  }

  if (payOperation) {
    let p
    switch (payOperation.type) {
      case 'payAddress':
        p = <input type="number" placeholder="Pay amount to chain address" value={amountToPay} onChange={e => setAmountToPay(+e.target.value)} />
        break
      case 'payInvoice':
        p = <div><p>You will pay: {payOperation.amount}sats to invoice</p></div>
        break
    }
    return <div className="Scan_pay_operation">
      {p}
      <button onClick={() => pay(payOperation)}>OK</button>
    </div>
  }

  return (
    <div className="Scan">
      <div onClick={() => { navigate("/home") }} className="Scan_back">
        {Icons.closeIcon()}
      </div>
      <div className="Scan_wall">
        <div className="Scan_square" />
      </div>
      <div className="Scan_scanner">
        <QrReader
          // scanDelay={1000}
          onResult={(result: any, error: any) => {
            if (!!result) {
              console.log(result.text);
              handleSubmit(result.text);
              navigate("/home");
              // return;
            }

            if (!!error) {
              console.info(error);
              // setError('Device Not found');
            }
          } } 
          constraints={{ facingMode: "environment" } }
        />
      </div>
      <div className="Scan_result_input">
        <input
          type="text"
          onChange={(e) => setItemInput(e.target.value)}
          placeholder="... Or paste Clipboard"
          value={itemInput}
        />
        <span className="Scan_input_icon">{Icons.pasteIcon()}</span>
      </div>
    </div>
  )
}