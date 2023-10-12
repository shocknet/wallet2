import React, { useEffect, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { QrReader } from "react-qr-reader";
import { PageProps, SpendFrom } from "../../globalTypes";
import { Modal } from "../../Components/Modals/Modal";
import { notification } from 'antd';

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { bech32 } from "bech32";
import { nostr } from '../../Api';
import { UseModal } from "../../Hooks/UseModal";
import { useSelector, useDispatch } from 'react-redux';
import { addSpendSources } from '../../State/Slices/spendSourcesSlice';
import { NotificationPlacement } from "antd/es/notification/interface";
import axios from "axios";
// import bolt11 from "bolt11";

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

  //declaration about reducer
  const dispatch = useDispatch();
  const spendSources = useSelector((state: any) => state.spendSource).map((e: any) => { return { ...e } });

  const navigate: NavigateFunction = useNavigate();

  const [itemInput, setItemInput] = useState("");
  let scaned = false;
  const [error, setError] = useState("");
  const [qrCodeLnurl, setQrCodeLnurl] = useState("");
  const [payOperation, setPayOperation] = useState<PayInvoice | PayAddress | null>(null)
  const [amountToPay, setAmountToPay] = useState(0)
  const { isShown, toggle } = UseModal();

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

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

  const handleSubmit = async (qrcode: string) => {
    if (scaned) return;
    scaned = true;
    // console.log(bolt11.decode(qrcode.replaceAll("lightning:", "")))
    try {
      let { words: dataPart } = bech32.decode(qrcode.replace("lightning:", ""), 2000);
      let sourceURL = bech32.fromWords(dataPart);
      const lnurlLink = Buffer.from(sourceURL).toString();
      setQrCodeLnurl(qrcode);
      if (lnurlLink.includes("withdraw")) {
        toggle();
      } else {
        navigate("/home")
      }
    } catch (error) {
      return openNotification("top", "Error", "Please scan correct QRcode!");
    }
  }

  const pay = async (action: PayInvoice | PayAddress) => {
    switch (action.type) {
      case 'payAddress':
        const resA = await nostr.PayAddress({
          address: action.address,
          amoutSats: amountToPay,
          satsPerVByte: 10
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

  const addSource = async () => {
    let { prefix: s, words: dataPart } = bech32.decode(qrCodeLnurl.replace("lightning:", ""), 2000);
    let sourceURL = bech32.fromWords(dataPart);
    const lnurlLink = Buffer.from(sourceURL).toString()
    console.log(lnurlLink, s);

    let resultLnurl = new URL(lnurlLink);
    const parts = resultLnurl.hostname.split(".");
    const sndleveldomain = parts.slice(-2).join('.');
    let amountSats = "0";
    try {
      const amount = await axios.get(lnurlLink);
      amountSats = (amount.data.maxWithdrawable / 1000).toString();
      console.log(amountSats, lnurlLink);

    } catch (error) {
      console.log(error);

    }
    const addedSource = {
      id: spendSources.length,
      label: resultLnurl.hostname,
      option: "A little.",
      icon: sndleveldomain,
      balance: parseInt(amountSats).toString(),
      pasteField: qrCodeLnurl,
    } as SpendFrom;
    dispatch(addSpendSources(addedSource));
    toggle();
    navigate("/sources")
  }

  useEffect(() => {

  })

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

  const askSaveContent = <React.Fragment>
    <div className='Sources_modal_header'>Add Source</div>
    <div className='Sources_modal_discription'>Would you like to add this url to source?</div>
    <div className="Sources_modal_add_btn">
      <button onClick={toggle}>Ignore</button>
      <button onClick={addSource}>Add</button>
    </div>

  </React.Fragment>;

  return (
    <div className="Scan">
      {contextHolder}
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
              handleSubmit(result.text);
              // navigate("/home");
              // return;
            }

            if (!!error) {
              // console.info(error);
              // setError('Device Not found');
            }
          }}
          constraints={{ facingMode: "environment" }}
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
      <Modal isShown={isShown} hide={toggle} modalContent={askSaveContent} headerText={''} />
    </div>
  )
}