import React, { ChangeEvent, useEffect, useState } from 'react';
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
import { keylinkAppId } from '../../constants';
import { getNostrPrivateKey, setNostrPrivateKey } from '../../Api/nostr';
import { getPublicKey } from '../../Api/tools/keys';
import { fetchRemoteBackup } from '../../helpers/remoteBackups';
import { useDispatch } from '../../State/store';
import { setRemoteBackupNProfile } from '../../State/Slices/prefsSlice';

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

  const [email, setEmail] = useState("");
  const [serviceCheck, setServiceCheck] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseR, setPassphraseR] = useState("");
  const [dataFromFile, setDataFromFile] = useState("");
  const [remoteBackupProfile, setRemoteBackupProfile] = useState("");
  const [remoteBackupToken, setRemoteBackupToken] = useState("");
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
    const urlParams = new URLSearchParams(window.location.search)
    const pubkey = urlParams.get("t")
    if (!pubkey) {
      return
    }
    const nsec = urlParams.get("n")
    if (!nsec || pubkey !== getPublicKey(nsec)) {
      console.log("invalid pub/priv key recovered from keylink")
      return
    }
    setNostrPrivateKey(nsec)
    const destination = urlParams.get("d")
    if (destination) {
      router.push(destination)
    }
  }, [])

  const loginEmail = () => {
    if (!email) {
      console.log("no email provided")
      return
    }
    keyLinkClient.RequestUserAuth({
      app_id: keylinkAppId,
      email
    })
  }
  const signUpEmail = () => {
    if (!email) {
      console.log("no email provided")
      return
    }
    throw new Error("use different key for link")
    const nsec = getNostrPrivateKey()!
    keyLinkClient.LinkAppUserToEmail({
      app_id: keylinkAppId,
      email,
      identifier: getPublicKey(nsec),
      nostr_secret: nsec
    })
  }

  const openDownBackupModal = () => {
    setModalContent('encrypt');
    toggle();
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

  const [modalContent, setModalContent] = useState('encrypt');
  const switchModalContent = () => {
    switch (modalContent) {
      case 'encrypt':
        return encryptBackupModal
      case 'decrypt':
        return decryptBackupModal;
      default:
        return encryptBackupModal;
    }
  }

  const loadRemoteBackup = async () => {
    const keyExists = getNostrPrivateKey()
    if (keyExists) {
      console.log("cannot load remote backups, key already exists")
    }
    if (!remoteBackupProfile) {
      console.log("no remote backup npub provided")
      return
    }
    if (!remoteBackupToken) {
      console.log("no remote backup token provided")
      return
    }
    const backup = await fetchRemoteBackup(remoteBackupProfile, remoteBackupToken)
    if (!backup) {
      console.log("no remote backup found for user")
      return
    }
    const data = JSON.parse(backup);
    const keys = Object.keys(data)
    for (let i = 0; i < keys.length; i++) {
      const element = keys[i];
      localStorage.setItem(element, data[element])
    }
    dispatch(setRemoteBackupNProfile(remoteBackupProfile))
    openNotification("top", "Success", "Backup is imported successfully.");
    setTimeout(() => {
      router.push("/home")
    }, 1000);
  }

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
        <div style={{ opacity: "0" }}>
          <div className="Auth_header_text">Back-Up & Restore</div>
          <div className='Auth_description'>
            <p className='Auth_description_header'>
              Recommended:
            </p>
            <p className='Auth_description_para'>
              Use the built-in <u>storage service</u> to recover your connections in the event your device data gets lost. The 1000 sats a month supports open-source development.
            </p>
          </div>
          <div className='Auth_service' onClick={() => { setServiceCheck(!serviceCheck) }}>
            <p className='Auth_service_title'>Use Storage Service</p>
            <input checked={serviceCheck} onChange={() => { setServiceCheck(!serviceCheck) }} className='Auth_service_box' type='checkbox' />
          </div>
          <div className='Auth_serviceauth'>
            <header>Service Auth</header>
            <input value={email} onChange={(e) => { setEmail(e.target.value) }} type="text" placeholder="Your npub or email@address.here" />
          </div>
          <div className="Auth_auth_send">
            <button onClick={() => loginEmail()}>{Icons.send()}LOGIN</button>
            <button onClick={() => signUpEmail()}>{Icons.send()}SIGNUP</button>
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
            <p className='Auth_description_note_header'>Note:</p> Be sure to download an updated file after adding or modifying connections.
          </div>
        </div>
        <div className='Auth_border'></div>
        <div className='Auth_import'>
          <input type='file' ref={fileInputRef} onChange={(e) => { getDatafromBackup(e) }} style={{ display: "none" }} />
          <p onClick={() => fileInputRef.current?.click()}>Import File Backup</p>
        </div>
        <div className='Auth_import'>
          <input value={remoteBackupProfile} onChange={(e) => { setRemoteBackupProfile(e.target.value) }} type="text" placeholder="nprofile of remote signer" />
          <input value={remoteBackupToken} onChange={(e) => { setRemoteBackupToken(e.target.value) }} type="text" placeholder="token of remote signer" />
          <p onClick={() => loadRemoteBackup()}>Import Remote Backup</p>
        </div>
        <Modal isShown={isShown} hide={toggle} modalContent={switchModalContent()} headerText={''} />
      </div>
    </div>
  )
}