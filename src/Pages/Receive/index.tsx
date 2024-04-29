import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';


//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { UseModal } from '../../Hooks/UseModal';
import { isAxiosError } from 'axios';
import { Modal } from '../../Components/Modals/Modal';
import { useIonRouter } from '@ionic/react';
import { Buffer } from 'buffer';
import { bech32 } from 'bech32';
import { useSelector } from '../../State/store';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from "@capacitor/share";
import { useDispatch } from '../../State/store';
import { addAsset } from '../../State/Slices/generatedAssets';
import { createLnurlInvoice, createNostrInvoice, createNostrPayLink, getNostrBtcAddress } from '../../Api/helpers';
import { parseBitcoinInput } from '../../constants';
import { toggleLoading } from '../../State/Slices/loadingOverlay';
import Toggle from '../../Components/Toggle';
import { decodeNprofile } from '../../custom-nip19';
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";
import { Tab, Tabs } from '../../Components/ReceiveScreenTabs';



const buttonText: string[] = [
  'LNURL',
  'INVOICE',
  'CHAIN'
]


const ErrorMessage = ({ text }: { text: string }) => {
  return (
    <div style={{ display: "flex", width: "100%", height: "70vh", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", fontSize: "1.2em", color: "#268fbc" }}>
        <span>{text}</span>
        <span>😕</span>
      </div>
    </div>
  )
}



export const Receive = () => {
  const dispatch = useDispatch();
  //reducer
  const paySource = useSelector((state) => state.paySource)
  const receiveHistory = useSelector((state) => state.history);
  const fiatUnit = useSelector((state) => state.prefs.FiatUnit);

  const price = useSelector((state) => state.usdToBTC);
  const { isShown, toggle } = UseModal();
  const [amount, setAmount] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [LNInvoice, setLNInvoice] = useState("");
  const [LNurl, setLNurl] = useState("");
  const [valueQR, setQR] = useState("");
  const [lightningAdd, setLightningAdd] = useState("");
  const [tag, setTag] = useState(0);
  const [bitcoinAdd, setBitcoinAdd] = useState("");
  const [bitcoinAddText, setBitcoinAddText] = useState("");
  const [invoiceMemo, setInvoiceMemo] = useState("");
  const [fiatSymbol, setFiatSymbol] = useState('$');
  const [btcDisabled, setBTCDisabled] = useState(false);
  const [lnurlDisabled, setLnurlDisabled] = useState(false)




  const router = useIonRouter();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [showingLightningAddress, setShowingLightningAddress] = useState(!!paySource.sources[paySource.order[0]]?.vanityName)

  const deg = "rotate(0deg)";
  const vReceive = 1;

  const tabsRef = useRef<any>();


  const lnAddress = useMemo(() => {
    if (paySource.order.length === 0) {
      return null;
    }

    const topPaySource = paySource.sources[paySource.order[0]];
    const vanityName = topPaySource.vanityName
    if (!vanityName) {
      return null;
    }

    if (vanityName.includes("@")) { // lnAddress from LV integration
      return vanityName
    } else {
      const decoded = decodeNprofile(topPaySource.pasteField);
      const url = decoded.bridge![0];

      const hostName = new URL(url);
      const parts = hostName.hostname.split(".");
      const domainName = parts.slice(-2).join('.');
      return `${vanityName}@${domainName}`
    }
  }, [paySource])

  useEffect(() => {
    if (fiatUnit.symbol) {
      setFiatSymbol(fiatUnit.symbol);
    }
  }, [fiatUnit])

  useEffect(() => {
    if (isShown && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [isShown])



  const setValueQR = (param: string) => {
    setQR(param/* .toUpperCase() */);
  }



  useEffect(() => {
    if (paySource.order.length === 0) {
      toast.error(<Toast title="Error" message="You don't have any sources!" />)
      router.push("/home");
    } else {
      configLnurlAndBtcAddress();
    }
    return () => {
      dispatch(toggleLoading({ loadingMessage: "" }))
    }
  }, []);


  useEffect(() => {
    if (receiveHistory.latestOperation !== undefined && receiveHistory.latestOperation.identifier === LNInvoice.replaceAll("lightning:", "")) {
      console.log("got thats what I was looking for")
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    }
  }, [receiveHistory.latestOperation])




  const copyToClip = async () => {
    const clipboardStr = valueQR.split(":")[1];
    await Clipboard.write({
      string: clipboardStr
    }).then(() => {
      dispatch(addAsset({ asset: clipboardStr }));
    });
    
    toast.success("Copied to clipbaord.")
  };


  const configInvoice = useCallback(async (amountToRecive: string) => {
    const topPaySource = paySource.sources[paySource.order[0]];
    let invoice = "";
    try {
      if (topPaySource.pubSource && topPaySource.keys) {
        invoice = await createNostrInvoice(topPaySource.pasteField, topPaySource.keys, +amountToRecive, invoiceMemo);
      } else {
        const parsedPaySource = await parseBitcoinInput(topPaySource.pasteField)
        invoice = await createLnurlInvoice(+amountToRecive, parsedPaySource);
      }
      setValueQR(`lightning:${invoice}`);
      setLNInvoice(`lightning:${invoice}`);
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        toast.error(<Toast title="Source Error" message={err.response.data.reason} />)
      } else if (err instanceof Error) {
        toast.error(<Toast title="Source Error" message={err.message} />)
      } else {
        console.log("Unknown error occured", err);
      }
    }
  }, [paySource, invoiceMemo]);

  const configLnurlAndBtcAddress = useCallback(async () => {
    dispatch(toggleLoading({ loadingMessage: "Loading..." }))
    if (LNurl !== "") return;
    const topPayToSource = paySource.sources[paySource.order[0]];

    try {
      if (topPayToSource.pubSource && topPayToSource.keys) {
        const lnurl = await createNostrPayLink(topPayToSource.pasteField, topPayToSource.keys);
        setLNurl("lightning:" + lnurl);
        setValueQR("lightning:" + lnurl);
      } else if (topPayToSource.pasteField.includes("@")) {
        const endpoint = "https://" + topPayToSource.pasteField.split("@")[1] + "/.well-known/lnurlp/" + topPayToSource.pasteField.split("@")[0];
        const words = bech32.toWords(Buffer.from(endpoint, 'utf8'));
        const lnurl = bech32.encode("lnurl", words, 999999);
        setLightningAdd(topPayToSource.label);
        setLNurl(`lightning:${lnurl}`);
        setValueQR(`lightning:${lnurl}`);
      } else {
        setLightningAdd(topPayToSource.label);
        setLNurl(`lightning:${topPayToSource.pasteField}`);
        setValueQR(`lightning:${topPayToSource.pasteField}`);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Lnurl not enabled")) {
          setLnurlDisabled(true)
          toast.error(<Toast title="Lnurl Error" message={"Lnurl not enabled in Lightning.Pub"} />)

        }
      }
    }

    try {
      // btc address
      if (topPayToSource.pubSource && topPayToSource.keys) {
        if (bitcoinAdd !== '') return;
        const address = await getNostrBtcAddress(topPayToSource.pasteField, topPayToSource.keys);

        setBitcoinAdd(address);
        setBitcoinAddText(
          address.substring(0, 5) + "..." + address.substring(address.length - 5, 5)
        )
      } else {
        setBTCDisabled(true)
      }
    } catch (err) {
      console.log(err)
    }
    dispatch(toggleLoading({ loadingMessage: "" }));
  }, [LNurl, paySource, dispatch, bitcoinAdd]);




  const updateInvoice = async () => {
    
    toggle();
    if (!amount) {
      toast.error(<Toast title="Error" message="You need to set an amount." />)
      return;
    }
    dispatch(toggleLoading({ loadingMessage: "Loading..." }))
    setAmountValue(amount);
    await configInvoice(amount);
    setTag(1);
    dispatch(toggleLoading({ loadingMessage: "" }));
  }

  const changeQRcode = (index: number) => {
    setTag(index);
    switch (index) {
      case 0:
        setValueQR(LNurl);
        break;

      case 1:
        if (!amount) {
          toggle();
          setValueQR("");
          return;
        }
        setValueQR(LNInvoice);
        break;

      case 2:
        if (bitcoinAdd) {
          setValueQR(`bitcoin:${bitcoinAdd}`);
        } else {
          setValueQR("");
        }
        break;

      default:
        break;
    }
  }

  const shareText = async () => {
    try {
      await Share.share({
        title: 'Share',
        text: valueQR,
        dialogTitle: 'Share with'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const setAmountContent = <React.Fragment>
    <div className="Sources_notify" id="amount-modal">
      <div className="Sources_notify_title">Receive via Invoice</div>
      <div className="Receive_result_input">
        <input
          ref={amountInputRef}
					id="invoice-amount"
          type="number"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              updateInvoice();
            }

          }}
          onChange={(e) => { setAmount(e.target.value === "" ? "" : parseInt(e.target.value).toString()) }}
          placeholder="Enter amount in sats"
          value={amount}
        />
        <input
          type="text"
          maxLength={90}
          style={{marginTop: "15px"}}
          id="invoice-memo"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              updateInvoice();
            }

          }}
          onChange={(e) => setInvoiceMemo(e.target.value)}
          placeholder="Description (optional)"
          value={invoiceMemo}
        />
      </div>
      <div className='Receive_modal_amount'>
        ~ {fiatSymbol}{parseInt(amount === "" ? "0" : amount) === 0 ? 0 : (parseInt(amount === "" ? "0" : amount) * price.buyPrice * 0.00000001).toFixed(2)}
      </div>
      <button className="Sources_notify_button" onClick={updateInvoice} id="confirm-invoice-amount">OK</button>
    </div>
  </React.Fragment>;

  return (
    <div>
      <div className="Receive" style={{ opacity: vReceive, zIndex: vReceive ? 1000 : -1 }}>
        <Tabs ref={tabsRef}>
          <Tab> {/* lnurl */}
            {
              lnurlDisabled
              ?
              <ErrorMessage text="LNURL Disabled" />
              :
              <>
                <div className="Receive_QR_text">
                  <span>{showingLightningAddress ? "Lightning Address" : "LNURL"}</span>
                  {
                    lnAddress !== null
                    &&
                    <Toggle
                      value={!showingLightningAddress}
                      onCheck={() => setShowingLightningAddress(!showingLightningAddress)}
                    />
                  }
                </div>
                {
                  valueQR
                  &&
                  <div className="Receive_QR" style={{ transform: deg }}>
                    <QRCodeSVG
                      style={{ textAlign: "center", transitionDuration: "500ms" }}
                      value={valueQR.toUpperCase()}
                      size={250}
                    />
                    <div className="Receive_logo_container">
                      {Icons.Logo()}
                    </div>
                  </div>
                  
                }
                <div className='Receive_copy'>
                  {lightningAdd}
                </div>
                {
                  (showingLightningAddress && lnAddress !== null)
                  &&
                  <div style={{fontSize: "17px", marginTop: "12px"}}>{lnAddress}</div>
                }
                <div className="Receive_set_amount_copy">
                  <button id ="copy-button" onClick={copyToClip} style={{ width: "130px" }}>{Icons.copy()}COPY</button>
                  <div style={{ width: "20px" }} />
                  <button id="share-button" onClick={shareText} style={{ width: "130px" }}>{Icons.share()}SHARE</button>
                </div>
              </>
            }
          </Tab>
          <Tab> {/* ln invoice */}
            <div className="Receive_QR_text">
              <span>Lightning Invoice</span>
            </div>
            {
              valueQR
              &&
              <div className="Receive_QR" style={{ transform: deg }}>
                <QRCodeSVG
                  style={{ textAlign: "center", transitionDuration: "500ms" }}
                  value={valueQR.toUpperCase()}
                  size={250}
                />
                <div className="Receive_logo_container">
                  {Icons.Logo()}
                </div>
              </div>
            }
            
            <div className='Receive_copy'>
              <React.Fragment>
                <div>{`${amount} sats`}</div>
                <div>{`~ ${parseInt(amountValue === "" ? "0" : amountValue) === 0 ? 0 : (parseInt(amountValue === "" ? "0" : amountValue) * price.buyPrice * 0.00000001).toFixed(2)} ${fiatSymbol}`}</div>
              </React.Fragment>
            </div>
            
            <div className="Receive_set_amount">
              <button id="set-amount-button" onClick={toggle}>SET AMOUNT</button>
            </div>
            <div className="Receive_set_amount_copy">
              <button id ="copy-button" onClick={copyToClip} style={{ width: "130px" }}>{Icons.copy()}COPY</button>
              <div style={{ width: "20px" }} />
              <button id="share-button" onClick={shareText} style={{ width: "130px" }}>{Icons.share()}SHARE</button>
            </div>
          </Tab>
          <Tab> {/* btc address */}
            {
              btcDisabled
              ?
              <ErrorMessage text="Cannot receive on-chain transactions" />
              :
              <>
                <div className="Receive_QR_text">
                  <span>On-chain Address</span>
                </div>
                {
                  valueQR
                  &&
                  <div className="Receive_QR" style={{ transform: deg }}>
                    <QRCodeSVG
                      style={{ textAlign: "center", transitionDuration: "500ms" }}
                      value={valueQR.toUpperCase()}
                      size={250}
                    />
                    <div className="Receive_logo_container">
                      {Icons.Logo()}
                    </div>
                  </div> 
                }
                <div className='Receive_copy'>{bitcoinAddText}</div>
                <div className="Receive_set_amount_copy">
                  <button id ="copy-button" onClick={copyToClip} style={{ width: "130px" }}>{Icons.copy()}COPY</button>
                  <div style={{ width: "20px" }} />
                  <button id="share-button" onClick={shareText} style={{ width: "130px" }}>{Icons.share()}SHARE</button>
                </div>
              </>
            }
          </Tab>
        </Tabs>
        <div className="Receive_other_options">
          <div className="Receive_lnurl">
            <button onClick={() => {
              changeQRcode((tag + 1) % 3)
              tabsRef.current.handleTabChange(true)
            }
            }>
              {Icons.arrowLeft()}{buttonText[(tag + 1) % 3]}
            </button>
          </div>
          <div className="Receive_chain">
            <button onClick={() => {
              changeQRcode((tag + 2) % 3)
              tabsRef.current.handleTabChange(false)
            }}>
              {buttonText[(tag + 2) % 3]}{Icons.arrowRight()}
            </button>
          </div>
        </div>
      </div >
      <Modal isShown={isShown} hide={toggle} modalContent={setAmountContent} headerText={''} />
    </div>
  )
}
