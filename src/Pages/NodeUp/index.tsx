import React, { useEffect } from "react";
import {  } from "react-router-dom";
import { useIonRouter } from '@ionic/react';
import { setNostrPrivateKey } from "../../Api/nostr";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_PUB_DESTINATION, NOSTR_RELAYS, options } from "../../constants";
import { useDispatch } from "react-redux";
import { useSelector } from "../../State/store";
import { nip19 } from "nostr-tools";
import { addPaySources } from "../../State/Slices/paySourcesSlice";
import { addSpendSources } from "../../State/Slices/spendSourcesSlice";

export const NodeUp = () => {
  const router = useIonRouter();

  const privateKey = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
  const dispatch = useDispatch();
  const paySources = useSelector((state) => state.spendSource);
  const spendSources = useSelector((state) => state.spendSource);
  const toMainPage = () => {
    setPrivateKey();
    addBootStrapSources();
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

  
  const addBootStrapSources = async () => {
    if (paySources.length!=0&&spendSources.length!=0) {
      return;
    }else {
      let bootstrapBalance = "0";
      let nprofile = nip19.nprofileEncode({ pubkey: NOSTR_PUB_DESTINATION, relays: NOSTR_RELAYS })
      dispatch(addPaySources(
        {
          id: 0,
          label: "Bootstrap Node",
          pasteField: nprofile,
          option: options.little,
          icon: "0",
        }
      ));
      dispatch(addSpendSources(
        {
          id: 0,
          label: "Bootstrap Node",
          pasteField: nprofile,
          option: options.little,
          icon: "0",
          balance: bootstrapBalance,
        }
      ))
    }
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