import { useEffect, useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useDispatch } from '../../State/store';
import { isAxiosError } from "axios";
import { useIonRouter } from "@ionic/react";
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning';
import { Destination, InputClassification, parseBitcoinInput } from "../../constants";
import { toggleLoading } from "../../State/Slices/loadingOverlay";
import { isPlatform } from '@ionic/react';
import { Html5Qrcode } from "html5-qrcode";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";

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
  console.log("Scan")
  const startDesktopCamera = async (html5QrCode: Html5Qrcode) => {
    html5QrCode.start(
      { facingMode: 'environment' },
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
        toast.error(<Toast title="Error" message={err.message} />)
        router.goBack();
      });
  }

  useEffect(() => {
    if (!isPlatform("hybrid")) {
      let html5QrCode: Html5Qrcode | null = null;
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
          html5QrCode = new Html5Qrcode("reader");
          startDesktopCamera(html5QrCode)
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
  }, [])


  const setupMobileScanner = async () => {


    await BarcodeScanner.requestPermissions()
    const { camera } = await BarcodeScanner.checkPermissions();
    if (camera !== "granted") {
      const { camera: result } = await BarcodeScanner.requestPermissions();
      if (result !== "granted") {
        toast.error(<Toast title="Error" message="Need camera permissions" />)
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
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        toast.error(<Toast title="Source Error" message={err.response.data.reason} />)
      } else if (err instanceof Error) {
        toast.error(<Toast title="Source Error" message={err.message} />)
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
      ||
      (parsed.type === InputClassification.LNURL && parsed.lnurlType === "payRequest")
      ||
      parsed.type === InputClassification.NOFFER
    ) {
      history.push({
        pathname: "/send",
        state: parsed
      })
    } else if (parsed.type === InputClassification.LNURL && parsed.lnurlType === "withdrawRequest") {
      history.push({
        pathname: "/sources",
        state: parsed
      });
    } else if (parsed.type === InputClassification.UNKNOWN && parsed.data.startsWith("nprofile")) {
      history.push({
        pathname: "/sources",
        state: parsed
      });
    } else {
      toast.error(<Toast title="Error" message="Unrecognized QR code." />)
    }
  }

  return (
    <div className="">
      <div onClick={() => { console.log("back click"); router.goBack() }} style={{ textAlign: 'end' }}>
        {Icons.closeIcon()}
      </div>
      <div style={{ height: "80vh" }}>
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
    </div>
  )
}