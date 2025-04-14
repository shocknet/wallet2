import React, { ChangeEvent, useState, useCallback, useEffect } from 'react';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';
import { UseModal } from '../../Hooks/UseModal';
import { Modal } from '../../Components/Modals/Modal';
import { AES, enc } from 'crypto-js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isPlatform } from '@ionic/react';
import { ignoredStorageKeys, parseBitcoinInput } from '../../constants';
import { fetchRemoteBackup } from '../../helpers/remoteBackups';
import { setSanctumAccessToken } from '../../Api/sanctum';
import { SANCTUM_URL } from "../../constants";

import { useStore } from 'react-redux';
import { syncRedux, useDispatch, useSelector } from '../../State/store';
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";
import SanctumBox from '../../Components/SanctumBox';
import { getNostrExtention } from '../../helpers/nip07Extention';
import { Interval, getPeriodSeconds } from '../Automation';
import { v4 as uuid } from "uuid";
import { Subscription, updateActiveSub } from '../../State/Slices/subscriptionsSlice';
import { updateBackupData } from '../../State/Slices/backupState';
import Checkbox from '../../Components/Checkbox';
import classNames from 'classnames';


const FILENAME = "shockw";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
  });
}

const Auth = () => {
  const router = useIonRouter();
  const store = useStore();
  const dispatch = useDispatch()
  const [passphrase, setPassphrase] = useState("");
  const [passphraseR, setPassphraseR] = useState("");
  const [dataFromFile, setDataFromFile] = useState("");
  const backupStates = useSelector(state => state.backupStateSlice);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const arrowIconRef = React.useRef<HTMLInputElement>(null);
  const backupFileRef = React.useRef<HTMLInputElement>(null);

  const { isShown, toggle } = UseModal();

  const [isOnStorageService, setIsOnStorageService] = useState(backupStates.subbedToBackUp);


  // detect nostr browser extension
  const [hasNostrExtension, setHasNostrExtension] = useState(false);
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50;
    const checkNostrExtension = setInterval(() => {
      const w = window as any;
      if (w && w.nostr) {
        setHasNostrExtension(true);
        clearInterval(checkNostrExtension);
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(checkNostrExtension);
        }
      }
    }, 100)

    return () => clearInterval(checkNostrExtension);
  }, [])


  useEffect(() => {
    if (!isOnStorageService) {
      dispatch(updateBackupData({ subbedToBackUp: false, usingExtension: false, usingSanctum: false }));
    }
  }, [isOnStorageService, dispatch])









  const openDownBackupModal = () => {
    toggle();
  }

  const understandWaning = () => {
    setModalContent('encrypt');
    // toggle();
  }

  const downloadBackUp = async () => {
    if (passphrase != passphraseR || passphrase == "") {
      toast.error(<Toast title="Error" message="Passwords do not match." />)
      return;
    }

    const allData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "null";
      const value = localStorage.getItem(key);
      if (value && !ignoredStorageKeys.includes(key)) {
        allData[key] = value;
      }
    }
    console.log({ allData })
    const filename = `${FILENAME}-${new Date().toLocaleString().replace(/[,:\s/]/g, '-')}.dat`
    const encodedString: string = AES.encrypt(JSON.stringify(allData), passphrase).toString();
    const blob = new Blob([encodedString], { type: 'text/plain' });
    if (!isPlatform("hybrid")) {
      const link = document.createElement('a');
      link.download = filename;

      console.log({ encodedString })

      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onload = function () {
        link.href = reader.result as string;
        link.click();
      };
    } else {
      try {
        const savedFile = await Filesystem.writeFile({
          path: filename,
          data: await blobToBase64(blob),
          directory: Directory.Documents,
          recursive: true,
        });
        console.log({ savedFile })
        toast.success(<Toast title="Backup file saved successfuly" message={savedFile.uri} />);
      } catch (e: any) {
        toast.error(<Toast title="File backup download failed" message={e?.message || "not Error type"} />);
      }
    }
    toggle();
    setPassphrase("")
    setPassphraseR("")
  }

  const getDatafromBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file: File | undefined = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result && typeof event.target.result === "string") {
          const content = event.target.result.split(",")[1];
          const decodedString = atob(content);
          console.log({ decodedString })
          setDataFromFile(decodedString);
          setModalContent('decrypt');
          toggle();
        }
      };
      reader.onerror = (e) => console.log(e)
      reader.readAsDataURL(file);
    }
  }

  const importBackup = () => {
    console.log(passphrase);
    if (!passphrase) return;

    let decodedString: string = "";
    try {
      decodedString = AES.decrypt(dataFromFile, passphrase).toString(enc.Utf8);
    } catch (error) {
      toast.error(<Toast title="Error" message="Passphrase is not correct." />)
      return;
    }
    const data = JSON.parse(decodedString);
    for (let i = 0; i < Object.keys(data).length; i++) {
      const element = Object.keys(data)[i];
      if (element && !ignoredStorageKeys.includes(element)) {
        localStorage.setItem(element, data[element])
      }
    }
    store.dispatch(syncRedux());
    toggle();
    toast.success(<Toast title="Backup" message="Backup imported successfully. " />)
    setTimeout(() => {
      router.push("/home")
    }, 1000);
  }

  const notRcommendedToggle = () => {
    if (arrowIconRef.current?.style && backupFileRef.current?.style) {
      if (arrowIconRef.current.style.transform === "rotate(270deg) translate(-13px, 13px)") {
        arrowIconRef.current.style.transform = "rotate(0deg)";
        backupFileRef.current.style.opacity = "1";
        backupFileRef.current.style.visibility = "initial";
      } else {
        arrowIconRef.current.style.transform = "rotate(270deg) translate(-13px, 13px)";
        backupFileRef.current.style.opacity = "0";
        backupFileRef.current.style.visibility = "hidden";
      }
    }
  }


  const [modalContent, setModalContent] = useState<string>('');
  const switchModalContent = () => {
    switch (modalContent) {
      case 'encrypt':
        return encryptBackupModal
      case 'decrypt':
        return decryptBackupModal;
      default:
        return infoBackupModal;
    }
  }








  const infoBackupModal = <React.Fragment>
    <div className='Auth_modal_header'>Warning</div>
    <div className='Auth_modal_description'>File-based backups are used for recovery of connection details in the event of lost/replaced devices.</div>
    <div className='Auth_modal_description' style={{ color: "#ff0000" }}>
      Using file-backups to sync multiple devices may result in conflicts.
    </div>
    <div className='Auth_modal_description'>If you require multiple devices to be in active sync, <b>use the sync service.</b></div>
    <div className="Auth_modal_add_btn">
      <button onClick={understandWaning}>I Understand</button>
    </div>

  </React.Fragment>;

  const encryptBackupModal = <React.Fragment>
    <div className='Auth_modal_header'>Encrypt Backup</div>
    <div className='Auth_modal_description'>Set a passphrase for your backup file.</div>
    <div className='Auth_serviceauth'>
      <input value={passphrase} onChange={(e) => { setPassphrase(e.target.value) }} type="text" placeholder="Sentences make for good entropy" />
      <input value={passphraseR} onChange={(e) => { setPassphraseR(e.target.value) }} type="text" placeholder="Sentences make for good entropy" />
    </div>
    <div className="Auth_modal_add_btn">
      <button onClick={downloadBackUp}>OK</button>
    </div>

  </React.Fragment>;

  const decryptBackupModal = <React.Fragment>
    <div className='Auth_modal_header'>Decrypt Backup</div>
    <div className='Auth_modal_description'>Please insert your passphrase</div>
    <div className='Auth_serviceauth'>
      <input value={passphrase} onChange={(e) => { setPassphrase(e.target.value) }} type="text" placeholder="Sentences make for good entropy" />
    </div>
    <div className="Auth_modal_add_btn">
      <button onClick={importBackup}>OK</button>
    </div>

  </React.Fragment>;



  const subscribeToBackupService = useCallback(async () => {
    return console.log("Recurring payments not implemented")
    const schedule = Interval.MONTHLY
    const periodSeconds = getPeriodSeconds(schedule);
    const des = await parseBitcoinInput("lnurl1dp68gup69uhkcmmrv9kxsmmnwsarsv3cxghkzurf9anh2etnwshkcmn4wfk97urp0yhkjmnxdulkkvfaxguryepcxymxzvf5v5ervcf3xumnxwp3v9jnsen9xccrjve3v93rxd3cxgcnvv3kxcexzvpexfnrzv3jxgenge3cxucrzcmpx5uq47rkwa");
    const newSubId = uuid()

    const subObject: Subscription = {
      subId: newSubId,
      periodSeconds: periodSeconds,
      subbedAtUnix: Math.floor(Date.now() / 1000),
      price: {
        type: "sats",
        amt: 1000
      },
      memo: "backup service",
      destionation: des,
      interval: schedule,
      enabled: true
    };

    dispatch(updateActiveSub({ sub: subObject }));
  }, [dispatch]);

  const handleBackupConfirm = useCallback(async (sanctum: boolean) => {
    await subscribeToBackupService();
    dispatch(updateBackupData({ subbedToBackUp: true, usingExtension: !sanctum, usingSanctum: sanctum }))


  }, [dispatch, subscribeToBackupService])

  return (
    <div className='Auth_container'>
      <div className="Auth">
        <div style={{ opacity: "1" }}>
          <div className="Auth_header_text">Back-Up & Restore</div>
          <div className='Auth_description'>
            <p className='Auth_description_header'>
              Recommended:
            </p>
            <p className='Auth_description_para'>
              Use the built-in storage service to sync your connections across devices, or recover your connections should your data become lost. A donation of 615 sats per month supports open-source development.
            </p>
            <div className='Auth_description_checkbox-container'>
              <div className="Auth_description_checkbox-mini-container">
                <label htmlFor='checkbox-storage-service'>Use Storage Service</label>
                <Checkbox state={isOnStorageService} setState={(e) => setIsOnStorageService(e.target.checked)} id="checkbox-storage-service" />
              </div>
            </div>


          </div>
          <div className={classNames({
            "Auth_shadable-container": true,
            "Auth_shadable-container_shaded": !isOnStorageService
          })}
          >
            {!hasNostrExtension && <span className='Auth_shadable-container_subtitle'>Log-In with Nostr</span>}
            {
              hasNostrExtension
                ?
                backupStates.subbedToBackUp
                  ?
                  <div className='Auth_shadable-container_nostr-extension-text'>✓ Using Nostr Browser extension</div>
                  :
                  <button className='Auth_shadable-container_nostr-extension-text' onClick={() => handleBackupConfirm(false)}>Use Nostr extension</button>
                :
                <SanctumBox
                  loggedIn={backupStates.subbedToBackUp}
                  successCallback={(creds) => {
                    setSanctumAccessToken(creds.accessToken);
                    handleBackupConfirm(true);
                  }}
                  errorCallback={(reason) => toast.error(<Toast title="Sanctum Error" message={reason} />)}
                  sanctumUrl={SANCTUM_URL}
                />
            }
          </div>
        </div>
        <div className='Auth_border'>
          <p className='Auth_or'>or</p>
        </div>
        <div className='Auth_notRecommended' onClick={notRcommendedToggle}>
          <p>Not recommended</p>
          <div ref={arrowIconRef} style={{ transform: "rotate(270deg) translate(-13px, 13px)" }}>{Icons.arrowToggle()}</div>
        </div>
        <div ref={backupFileRef} className='Auth_download' style={{ visibility: "hidden", opacity: "0" }}>
          <div className="Auth_download_button">
            <button onClick={() => { openDownBackupModal() }}>
              Download File Backup
            </button>
          </div>
          <div className='Auth_import'>
            <input type='file' ref={fileInputRef} onChange={(e) => { getDatafromBackup(e) }} style={{ display: "none" }} />
            <p onClick={() => fileInputRef.current?.click()}>Import File Backup</p>
          </div>
          <div className='Auth_download_note'>
            Note: you must download an updated file after adding or modifying node sources. Limited syncing functionality.
          </div>
        </div>
        <Modal isShown={isShown} hide={toggle} modalContent={switchModalContent()} headerText={''} />
      </div>
    </div >
  )
}

export default Auth;