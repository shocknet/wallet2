import React, { useEffect, useState } from "react";
import { notification } from 'antd';
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
import { isPlatform } from '@ionic/react';
import { Html5Qrcode } from "html5-qrcode";
import { useHistory } from "react-router";

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
  
  const dispatch = useDispatch();
  const router = useIonRouter();
  const history = useHistory();

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

  
  const startDesktopCamera = async (html5QrCode: Html5Qrcode, cameraId: string) => {
    html5QrCode.start(
      cameraId, 
      {
        fps: 10,
      },
      (decodedText) => {
        dispatch(toggleLoading({ loadingMessage: "Loading..." }));
        handleSubmit(decodedText.toLowerCase())
      },
      (errorMessage) => {
        console.log(errorMessage)
      })
    .catch((err: any) => {
      openNotification("top", "Error", err.message)
      router.goBack();
    });
  }

  useEffect(() => {
    if(!isPlatform("hybrid")) {
      let html5QrCode: Html5Qrcode | null = null;
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
          const cameraId = devices[0].id;
          html5QrCode = new Html5Qrcode("reader");
          startDesktopCamera(html5QrCode, cameraId)
        }
      })
      return () => {
        if (html5QrCode) {
          html5QrCode.stop()
        }
      }
      
    } else {
      document.body.classList.add("barcode-scanner-active");
      setupMobileScanner();
      return () => {
        document.body.classList.remove("barcode-scanner-active");
        BarcodeScanner.stopScan();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const setupMobileScanner = async () => {

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
      history.push({
        pathname: "/send",
        state: parsed
      })
    } else if (parsed.type === InputClassification.LNURL && parsed.lnurlType === "payRequest") {
      toggle();
    } else if (parsed.type === InputClassification.LNURL && parsed.lnurlType === "withdrawRequest") {
      history.push({
        pathname: "/sources",
        state: {
          data: parsed
        }
      });
    } else if (parsed.type === InputClassification.UNKNOWN) {
      openNotification("top", "Error", "Unrecognized QR code!");
    }
  }




  const askSaveContent = <React.Fragment>
    <div className='Sources_modal_header'>{destiniation?.domainName}</div>
    <div className='Sources_modal_discription'>Would you like to send sats to this Lnurl or add it as a source?</div>
    <div className="Sources_modal_add_btn">
      <button
        onClick={() => history.push({ pathname: "/send", state: destiniation })}
      >Send</button>
      <button
        onClick={() => history.push({ pathname: "/sources", state: destiniation })}
      >Add as source</button>
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
        <div className="Scan_square" id="reader" />
      </div>
      <div className="Scan_result_input">
        <span className="Scan_input_icon">{Icons.pasteIcon()}</span>
        <input
          type="text"
          onChange={(e) => setItemInput(e.target.value)}
          placeholder="... Or paste Clipboard"
          value={itemInput}
        />
      </div>
      <Modal isShown={isShown} hide={() => console.log("no drop back")} modalContent={askSaveContent} headerText={''} />
    </div>
  )
}