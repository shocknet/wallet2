import React, { ChangeEvent, useEffect, useState } from 'react';
import { PageProps } from "../../globalTypes";

import { useSelector, useDispatch } from '../../State/store';
import axios from 'axios';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';
import { saveAs } from 'file-saver';
import { notification } from 'antd';
import { NotificationPlacement } from 'antd/es/notification/interface';
import { UseModal } from '../../Hooks/UseModal';
import { Modal } from '../../Components/Modals/Modal';
import { AES, enc } from 'crypto-js';

export const Auth = () => {
  //reducer
  const spendSources = useSelector((state) => state.spendSource).map((e) => { return { ...e } });

  const router = useIonRouter();

  const [auth, setAuth] = useState("");
  const [serviceCheck, setServiceCheck] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseR, setPassphraseR] = useState("");
  const [dataFromFile, setDataFromFile] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

  const { isShown, toggle } = UseModal();
  const send = () => {

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
    const blob = new Blob([encodedString], { type: 'text/plain;charset=utf-8' });

    saveAs(blob, 'shockw.dat');
    toggle();
    setPassphrase("")
    setPassphraseR("")
  }

  const getDatafromBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file: File | undefined = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setDataFromFile(content);
        setModalContent('decrypt');
        toggle();
      };
      reader.readAsText(file);
    }
  }

  const importBackup = () => {
    console.log(passphrase);
    if (!passphrase) return;

    var decodedString: string = "";
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
    toggle()
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
            <input value={auth} onChange={(e) => { setAuth(e.target.value) }} type="text" placeholder="Your npub or email@address.here" />
          </div>
          <div className="Auth_auth_send">
            <button onClick={send}>{Icons.send()}SEND</button>
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
        <Modal isShown={isShown} hide={toggle} modalContent={switchModalContent()} headerText={''} />
      </div>
    </div>
  )
}