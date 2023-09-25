import React, { useEffect } from "react";
import {  } from "react-router-dom";
import { useIonRouter } from '@ionic/react';
import { useSelector, useDispatch } from 'react-redux';
import { setNostrPrivateKey } from "../../Api/nostr";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_PUB_DESTINATION, options } from "../../constants";
import { addPaySources } from "../../State/Slices/paySourcesSlice";
import { addSpendSources } from "../../State/Slices/spendSourcesSlice";

export const NodeUp = () => {
  const router = useIonRouter();
  const dispatch = useDispatch();

  const privateKey = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);

  const toMainPage = () => {
    setNostrPrivateKey();
    addBootStrapSources();
    if (privateKey) {
      router.push("/home");
    }else {
      router.push("/loader")
    }
  };

  const toSourcePage = () => {
    setNostrPrivateKey()
    router.push("/sources")
  };

  const addBootStrapSources = () => {
    dispatch(addPaySources(
      {
        id: 0,
        label: "Bootstrap Node",
        pasteField: NOSTR_PUB_DESTINATION,
        option: options.little,
        icon: "0",
      }
    ));
    dispatch(addSpendSources(
      {
        id: 0,
        label: "Bootstrap Node",
        pasteField: NOSTR_PUB_DESTINATION,
        option: options.little,
        icon: "0",
        balance: "0",
      }
    ))
  }

  useEffect(() => {
    if(privateKey){
      router.push("/home")
    }
  }, []);

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