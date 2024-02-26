import { useLayoutEffect } from "react";
import { useIonRouter } from '@ionic/react';
import { DEFAULT_BRIDGE_URL, NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_PUB_DESTINATION, NOSTR_RELAYS, options } from "../../constants";
import { useDispatch, useSelector } from "../../State/store";
import { addPaySources } from "../../State/Slices/paySourcesSlice";
import { addSpendSources } from "../../State/Slices/spendSourcesSlice";
import { encodeNprofile } from "../../custom-nip19";

export const NodeUp = () => {
  const router = useIonRouter();

  // from local storage means the value here isn't updated upon doing an option
  // which serves the purpose of allowing the loader screen to show without immediately going to /home
  const privateKeyFromStorage = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);

  
  const dispatch = useDispatch();
  const paySources = useSelector((state) => state.spendSource);
  const spendSources = useSelector((state) => state.spendSource);
  const toMainPage = () => {
    addBootStrapSources();
    setTimeout(() => {      
      router.push("/loader")
    }, 100);
  };

  const toSourcePage = () => {
    router.push("/sources")
  };

  const toRecoverPage = () => {
    router.push("/auth")
  }

  useLayoutEffect(() => {
    if (privateKeyFromStorage) {
      router.push("/home")
    }
  }, []);




  const addBootStrapSources = async () => {
    if (Object.values(paySources.sources || {}).length !== 0 && Object.values(spendSources.sources || {}).length !== 0) {
      return;
    } else {
      const bootstrapBalance = "0";
      const nprofile = encodeNprofile({
        pubkey: NOSTR_PUB_DESTINATION,
        relays: NOSTR_RELAYS,
        bridge: [DEFAULT_BRIDGE_URL]
      })


      dispatch(addPaySources({
        id: NOSTR_PUB_DESTINATION,
        label: "Bootstrap Node",
        pasteField: nprofile,
        option: options.little,
        icon: "0",
        pubSource: true
      }));
      dispatch(addSpendSources({
        id: NOSTR_PUB_DESTINATION,
        label: "Bootstrap Node",
        pasteField: nprofile,
        option: options.little,
        icon: "0",
        balance: bootstrapBalance,
        pubSource: true
      }));
    }
  }

  return (
    <div className="NodeUp">
      <div className="NodeUp_title">Node Up</div>
      <div className="NodeUp_textBox">
        &quot;Continue&quot; to bootstrap the wallet with a trusted server and add a node later<br /><br /><br />
        &quot;Add connection&quot; to link a node now.
      </div>
      <div className="NodeUp_manual">
        <div className="NodeUp_manual_btn">
          <button onClick={toMainPage} id="continue-button">
            Continue
          </button>
        </div>
        <div className="NodeUp_manual_text">
          <div onClick={toSourcePage}>
            Add Connection
          </div>
          <span>|</span>
          <div onClick={toRecoverPage}>
            Recover Backup
          </div>
        </div>
      </div>
      <div className="NodeUp_terms">
        By proceeding you acknowledge that this is bleeding-edge software, and agree to the providers <a href="https://docs.shock.network/terms/" target="_blank" rel="noreferrer">terms</a> regarding any services herein.
      </div>
    </div>
  )
}