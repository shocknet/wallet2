import React, { useEffect } from "react";
import {  } from "react-router-dom";
import { useIonRouter } from '@ionic/react';
import { setNostrPrivateKey } from "../../Api/nostr";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_PUB_DESTINATION, NOSTR_RELAYS, options } from "../../constants";

export const NodeUp = () => {
  const router = useIonRouter();

  const privateKey = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
  const toMainPage = () => {
    setPrivateKey();
    if (privateKey) {
      router.push("/home");
    }else {
      router.push("/loader")
    }
  };

  const toSourcePage = () => {
    setPrivateKey()
    router.push("/sources")
  };

  useEffect(() => {
    if(privateKey){
      router.push("/home")
    }
  }, []);

  const setPrivateKey = () => {
    setNostrPrivateKey();
  }

  return(
    <div className="NodeUp">
      <div className="NodeUp_title">Node Up</div>
      <div className="NodeUp_textBox">
        "Continue" to bootstrap the wallet with a trusted server and add a node later<br/><br/><br/>
        "Add connection" to link a node now.
      </div>
      <div className="NodeUp_manual">
        <div onClick={toSourcePage} className="NodeUp_manual_text">
          Add Connection
        </div>
        <div className="NodeUp_manual_btn">
          <button onClick={toMainPage}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}