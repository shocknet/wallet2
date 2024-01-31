import React, { ChangeEvent, useEffect, useState } from 'react';
import Checkbox from '../../Components/Checkbox';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';
import { notification } from 'antd';
import { NotificationPlacement } from 'antd/es/notification/interface';
import { UseModal } from '../../Hooks/UseModal';
import { Modal } from '../../Components/Modals/Modal';
import { AES, enc } from 'crypto-js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isPlatform } from '@ionic/react';
import { keyLinkClient } from '../../Api/keylink/http';
import { keylinkAppId, keylinkUrl } from '../../constants';
import { getNostrPrivateKey, setNostrPrivateKey } from '../../Api/nostr';
import { generatePrivateKey, getPublicKey } from '../../Api/tools/keys';
import { fetchRemoteBackup } from '../../helpers/remoteBackups';
import { useDispatch } from '../../State/store';
import { getSanctumAccessToken, setSanctumAccessToken } from '../../Api/sanctum';

const FILENAME = "shockw.dat";

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

export const Auth = () => {
  //reducer
  const router = useIonRouter();

  const [checked, setChecked] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [sanctumNostrSecret, setSanctumNostrSecret] = useState<string>("");
  const [newPair, setNewPair] = useState(false);
  const [serviceCheck, setServiceCheck] = useState<boolean>(false);
  const [passphrase, setPassphrase] = useState<string>("");
  const [passphraseR, setPassphraseR] = useState<string>("");
  const [dataFromFile, setDataFromFile] = useState<string>("");
  const [retreiveAccessToken, setRetreiveAccessToken] = useState<boolean>(false);
  const [accessTokenRetreived, setAccessTokenRetreived] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useDispatch()
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

  const { isShown, toggle } = UseModal();

  useEffect(() => {
    const urlParams = new URLSearchParams(router.routeInfo.search)
    const accessToken = urlParams.get("accessToken")
    if (accessToken) {
      setSanctumAccessToken(accessToken)
      setAccessTokenRetreived(true)
    }
  }, [router])

  const signUpEmail = async () => {
    if (!email) {
      console.log("no email provided")
      return
    }
    const nsec = newPair ? generatePrivateKey() : sanctumNostrSecret
    if (!nsec) {
      console.log("no nsec provided")
      return
    }
    const res = await keyLinkClient.LinkAppUserToEmail({
      app_id: keylinkAppId,
      email,
      identifier: getPublicKey(nsec),
      nostr_secret: nsec
    })
    if (res.status === 'ERROR') {
      openNotification("top", "Error", "Email link failed.");
    }
    openNotification("top", "Error", "Email linked succesfully.");
  }

  const openDownBackupModal = () => {
    toggle();
  }
  
  const understandWaning = () => {
    setModalContent('encrypt');
    // toggle();
  }

  const downloadBackUp = async () => {
    if (passphrase != passphraseR || passphrase == "") {
      return openNotification("top", "Error", "Please insert same sentence.");
    }

    const allData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "null";
      const value = localStorage.getItem(key);
      allData[key] = value;
    }

    const encodedString: string = AES.encrypt(JSON.stringify(allData), passphrase).toString();
    const blob = new Blob([encodedString], { type: 'text/plain' });
    if (!isPlatform("hybrid")) {
      const link = document.createElement('a');
      link.download = FILENAME;

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
          path: FILENAME,
          data: await blobToBase64(blob),
          directory: Directory.Documents,
          recursive: true,
        });
        console.log({ savedFile })
      } catch (e) {
        console.log(e)
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
      return openNotification("top", "Error", "Passphrase is not correct.");
    }
    const data = JSON.parse(decodedString);
    for (let i = 0; i < Object.keys(data).length; i++) {
      const element = Object.keys(data)[i];
      localStorage.setItem(element, data[element])
    }
    toggle();
    openNotification("top", "Success", "Backup is imported successfully.");
    setTimeout(() => {
      router.push("/home")
    }, 1000);
  }

  useEffect(() => {
  });

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

  const loadRemoteBackup = async () => {
    const keyExists = getNostrPrivateKey()
    if (keyExists) {
      openNotification("top", "Error", "Cannot load remote backups. User already exists.");
      return
    }
    const backup = await fetchRemoteBackup()
    if (backup.result === 'accessTokenMissing') {
      console.log("access token missing")
      setRetreiveAccessToken(true)
      return
    }
    if (backup.decrypted === '') {
      openNotification("top", "Error", "No backups found from the provided pair.");
      return
    }
    const data = JSON.parse(backup.decrypted);
    const keys = Object.keys(data)
    for (let i = 0; i < keys.length; i++) {
      const element = keys[i];
      localStorage.setItem(element, data[element])
    }
    openNotification("top", "Success", "Backup is imported successfully.");
    setTimeout(() => {
      router.push("/home")
    }, 1000);
  }

  const infoBackupModal = <React.Fragment>
    <div className='Auth_modal_header'>Warning</div>
    <div className='Auth_modal_description'>File-based backups are used for recovery of connection details in the event of lost/replaced devices.</div>
    <div className='Auth_modal_description' style={{color: "#ff0000"}}>
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

  return (
    <div className='Auth_container'>
      {contextHolder}
      <div className="Auth">
        <div style={{ opacity: "1" }}>
          <div className="Auth_header_text">Back-Up & Restore</div>
          <div className='Auth_description'>
            <p className='Auth_description_header'>
              Recommended:
            </p>
            <p className='Auth_description_para'>
              Use the built-in <u>storage service</u> to sync your connections in the event your device data gets lost. A fee of 1000 sats month supports open-source development.
            </p>
          </div>
          <div className='Auth_service'>
            <p className='Auth_service_title'>Use Storage Service</p>
            <label htmlFor="service-rule-check">
              <Checkbox id="service-rule-check" state={serviceCheck} setState={(e) => setServiceCheck(e.target.checked)} />
            </label>
          </div>
          <div className='Auth_serviceauth'>
            <header>Service Auth</header>
            <input value={email} onChange={(e) => { setEmail(e.target.value) }} type="text" placeholder="email@address.here or nsec" />
            {/* <input type='checkbox' checked={newPair} onChange={e => setNewPair(e.target.checked)} />
            <input value={sanctumNostrSecret} onChange={(e) => { setSanctumNostrSecret(e.target.value) }} type="text" placeholder="Nostr secret to put in Sanctum" /> */}
          </div>
          <div className="Auth_auth_send">
            <button onClick={() => signUpEmail()}>{Icons.send()}SEND</button>
          </div>
          <div className='Auth_border'>
            <p className='Auth_or'>or</p>
          </div>
        </div>
        <div className='Auth_download'>
          <div className="Auth_download_button">
            <button onClick={() => { openDownBackupModal() }}>
              Download File Backup
            </button>
          </div>
          <div className='Auth_description_note'>
            <b>Note:</b> Be sure to download an updated file after adding or modifying connections.
          </div>
        </div>
        <div className='Auth_border'></div>
        <div className='Auth_import'>
          <input type='file' ref={fileInputRef} onChange={(e) => { getDatafromBackup(e) }} style={{ display: "none" }} />
          <p onClick={() => fileInputRef.current?.click()}>Import File Backup</p>
        </div>
        {/* <div className='Auth_import'>
          <p>Import remote backup</p>
          {!retreiveAccessToken && <div>
            {!accessTokenRetreived && <p>click to retreive a remote backup if you have one, if a nip07 extention is found, it will be used</p>}
            {accessTokenRetreived && <p>you are now linked to sanctum, click to retreive the backup</p>}
            <button onClick={() => loadRemoteBackup()}>LOAD</button>
          </div>}
          {retreiveAccessToken && <div>
            <p>no nip07 extion found, use Sanctum instead?</p>
            <a href={`${keylinkUrl}/sanctum?app=${keylinkAppId}&cb=${encodeURIComponent(window.location.origin + window.location.pathname)}`}><button>OPEN SANCTUM AUTH</button></a>
          </div>}
        </div> */}
        <Modal isShown={isShown} hide={toggle} modalContent={switchModalContent()} headerText={''} />
      </div>
    </div >
  )
}