import React, { useEffect, useMemo, useRef, useState } from "react";
import QrScanner from 'qr-scanner';
import { PageProps, SpendFrom } from "../../globalTypes";
import { notification } from 'antd';
import { Camera, CameraOptions, DestinationType, EncodingType, MediaType } from '@ionic-native/camera';
//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { bech32 } from "bech32";
import { UseModal } from "../../Hooks/UseModal";
import { useSelector, useDispatch } from '../../State/store';
import { addSpendSources } from '../../State/Slices/spendSourcesSlice';
import { NotificationPlacement } from "antd/es/notification/interface";
import axios from "axios";
import { useIonRouter } from "@ionic/react";
import { Modal } from "../../Components/Modals/Modal";
import { Buffer } from "buffer";
import { validate } from 'bitcoin-address-validation';
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
export const Scan = () => {

  //declaration about reducer
  const dispatch = useDispatch();
  const spendSources = useSelector((state: any) => state.spendSource).map((e: any) => { return { ...e } });

  const router = useIonRouter();

  const [itemInput, setItemInput] = useState("");
  const [error, setError] = useState("");
  const [qrCodeLnurl, setQrCodeLnurl] = useState("");
  const [payOperation, setPayOperation] = useState<PayInvoice | PayAddress | null>(null)
  const [amountToPay, setAmountToPay] = useState(0)
  const { isShown, toggle } = UseModal();
  const ref = useRef<HTMLVideoElement>(null)
  const [camsRotation, setCamsRotation] = useState<string[]>([])
  const [currentCam, setCurrentCam] = useState(0)
  const [allowRefocus, setAllowRefocus] = useState(true)
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null)
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

  const setupScanner = async () => {
    if (!ref.current) {
      return
    }
    const cameras = await QrScanner.listCameras(true)
    const cam2_0 = cameras.find(camera => camera.label.startsWith("camera2 0"))
    const defaultCam = cam2_0 ? cam2_0.id : 'environment'
    const rotation = cameras.filter(c => c.label.includes("facing back")).map(c => c.id)
    setCamsRotation([defaultCam, ...rotation])
    initScanner(ref.current, defaultCam)

  }

  const rotateCamera = async () => {
    if (!ref.current || camsRotation.length < 2) {
      return
    }
    setAllowRefocus(false)
    const nextCam = currentCam === camsRotation.length - 1 ? 0 : currentCam + 1
    setCurrentCam(nextCam)
    qrScanner?.stop()
    qrScanner?.destroy()
    await new Promise(res => setTimeout(res, 1500))
    initScanner(ref.current, camsRotation[nextCam])
    setTimeout(() => setAllowRefocus(true), 2000)
  }

  const initScanner = (current: HTMLVideoElement, cam: string) => {
    const scanner = new QrScanner(current,
      result => {
        handleSubmit(result.data)
        scanner.stop()
      }, { preferredCamera: cam });
    scanner.start()
    setQrScanner(scanner)
  }

  useEffect(() => {
    setupScanner()
  }, [])



  const handleSubmit = async (qrcode: string) => {
    console.log(qrcode);
    qrcode = qrcode.toLowerCase();
    qrcode = qrcode.replaceAll("lightning:", "");
    qrcode = qrcode.replaceAll('bitcoin:', "")

    //case of qr code is invoice
    if (qrcode.slice(0, 4) == "lnbc") {
      router.push("/send?url=" + qrcode)
      return;
    }
    //case of qr code is bitcoin address
    if (validate(qrcode)) {
      router.push("/send?url=" + qrcode)
      return;
    }
    //case of lnurl
    try {
      let { words: dataPart } = bech32.decode(qrcode, 2000);
      let sourceURL = bech32.fromWords(dataPart);
      const lnurlLink = Buffer.from(sourceURL).toString();

      setQrCodeLnurl(qrcode);
      //case withdraw link
      if (lnurlLink.includes("withdraw")) {
        toggle();
      } 
      //case deposite link
      else {
        router.push("/send?url=" + qrcode)
      }
      return;
    } catch (error) {
      openNotification("top", "Error", "Please scan correct QRcode!");
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    }
  }

  const [addLoading, setAddLoading] = useState("none");

  const addSource = async () => {
    setAddLoading("flex");
    toggle();
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
      setAddLoading("none");
      return openNotification("top", "Error", "There's error while adding source");
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
    setAddLoading("none");
    router.push("/sources")
  }

  const requestCameraPermission = async () => {
    try {
      const cameraOptions: CameraOptions = {
        quality: 90,
        destinationType: DestinationType.DATA_URL,
        encodingType: EncodingType.JPEG,
        mediaType: MediaType.PICTURE,
      };

      const imageData = await Camera.getPicture(cameraOptions);
      // Process the captured image data as needed
    } catch (error) {
      // Handle any errors that occur during camera access
    }
  };

  useEffect(() => {
    requestCameraPermission();
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
      <button onClick={() => { }}>OK</button>
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
      <div className='Scan_loading' style={{ display: addLoading }}>
        <div className='Scan_img'>
          {Icons.Animation()}
          <p>Adding Source</p>
        </div>
      </div>
      {contextHolder}
      <div onClick={() => { router.goBack() }} className="Scan_back">
        {Icons.closeIcon()}
      </div>
      {camsRotation.length > 1 && allowRefocus && <button onClick={() => rotateCamera()}>REFOCUS</button>}
      <div className="Scan_wall">
        <div className="Scan_square" />
      </div>
      <div className="Scan_scanner">
        <video ref={ref} width={"100%"} height={"100%"} />
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