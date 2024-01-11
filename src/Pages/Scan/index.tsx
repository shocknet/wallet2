import React, { useEffect, useState } from "react";
import { notification } from 'antd';
//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { UseModal } from "../../Hooks/UseModal";
import { useDispatch } from '../../State/store';
import { NotificationPlacement } from "antd/es/notification/interface";
import { isAxiosError } from "axios";
import { useIonRouter } from "@ionic/react";
import { Modal } from "../../Components/Modals/Modal";
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning';
import { Destination, InputClassification, parseBitcoinInput } from "../../constants";
import { toggleLoading } from "../../State/Slices/loadingOverlay";
// import bolt11 from "bolt11";



const scanSingleBarcode = async () => {
  return new Promise(resolve => {
    BarcodeScanner.addListener(
      "barcodeScanned",
      result => {
        BarcodeScanner.removeAllListeners();

        resolve(result.barcode.displayValue)
      }
    )
      .then(() => {
        BarcodeScanner.startScan({ formats: [BarcodeFormat.QrCode] })
      })
      .catch((err: any) => {
        if (err instanceof Error) {
          console.log(err.message)
        }
      })
  })
};

export const Scan = () => {

  //declaration about reducer
  const dispatch = useDispatch();


  const router = useIonRouter();

  const [itemInput, setItemInput] = useState("");

  const { isShown, toggle } = UseModal();

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

  const [destiniation, setDestination] = useState<Destination>();

  useEffect(() => {
    document.body.classList.add("barcode-scanner-active");
    setupScanner()
    return () => {
      document.body.classList.remove("barcode-scanner-active");
      BarcodeScanner.stopScan();
    }
  }, [])


  const setupScanner = async () => {

    await BarcodeScanner.requestPermissions()
    const { camera } = await BarcodeScanner.checkPermissions();
    if (camera !== "granted") {
      const { camera: result } = await BarcodeScanner.requestPermissions();
      if (result !== "granted") {
        openNotification("top", "Error", "The scanner needs camera permissions");
        return;
      }
    }
    const bardcode = await scanSingleBarcode() as string;
    dispatch(toggleLoading({ loadingMessage: "Loading..." }));
    await handleSubmit(bardcode.toLowerCase())
  }




  useEffect(() => {
    let { words: dataPart } = bech32.decode("nprofile1qqswxpkytms203mj2s83mjytqrme6tfezzlagpr7jyzcfxvda8y790spzemhxue69uhhyetvv9ujuatwd94kkafwvdhk6l6jep0", 2000)
    let sourceURL = bech32.fromWords(dataPart);
    console.log(Buffer.from(sourceURL).toString())
  }, [])



  const handleSubmit = async (qrcode: string) => {
    let parsed: Destination | null = null;
    try {
      parsed = await parseBitcoinInput(qrcode);
      setDestination(parsed);
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        openNotification("top", "Error", err.response.data.reason);
      } else if (err instanceof Error) {
        openNotification("top", "Error", err.message);
      } else {
        console.log("Unknown error occured", err);
      }
      router.push("/home");
      dispatch(toggleLoading({ loadingMessage: "" }));
      return;
    }
    dispatch(toggleLoading({ loadingMessage: "" }));
    if (
      parsed.type === InputClassification.BITCOIN_ADDRESS
      ||
      parsed.type === InputClassification.LN_INVOICE
      ||
      parsed.type === InputClassification.LN_ADDRESS
    ) {
      router.push(`/send?url=${parsed.data}`);
    } else if (parsed.type === InputClassification.LNURL && parsed.lnurlType === "payRequest") {
      toggle();
    } else if (parsed.type === InputClassification.LNURL && parsed.lnurlType === "withdrawRequest") {
      router.push(`/sources?url=${parsed.data}`);
    } else if (parsed.type === InputClassification.UNKNOWN) {
      openNotification("top", "Error", "Unrecognized QR code!");
    }
  }







  /*   if (error !== '') {
      return <div className="Scan_error">
        <div className="Scan_error_img">
          {Icons.ErrorMessage()}
        </div>
        <div className="Scan_error_text">{error}</div>
      </div>;
    } */

  /*   if (payOperation) {
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
        <button onClick={() => { }}>OK</button>
      </div>
    } */

  const askSaveContent = <React.Fragment>
    <div className='Sources_modal_header'>{destiniation?.domainName}</div>
    <div className='Sources_modal_discription'>Would you like to send sats to this Lnurl or add it as a source?</div>
    <div className="Sources_modal_add_btn">
      <button onClick={() => router.push(`/send?url=${destiniation?.data}`)}>Send</button>
      <button onClick={() => router.push(`/sources?url=${destiniation?.data}`)}>Add as source</button>
    </div>
  </React.Fragment>;

  return (
    <div className="Scan scan-layout">
      <div style={{ visibility: "visible" }}>
        {contextHolder}
      </div>
      <div onClick={() => { router.goBack() }} className="Scan_back">
        {Icons.closeIcon()}
      </div>
      <div className="Scan_wall">
        <div className="Scan_square" />
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
      <Modal isShown={isShown} hide={() => console.log("no drop back")} modalContent={askSaveContent} headerText={''} />
    </div>
  )
}