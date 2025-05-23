import { useIonRouter } from '@ionic/react';
import { NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from "../../constants";
import { useDispatch, useSelector } from "../../State/store";
import { addPaySources } from "../../State/Slices/paySourcesSlice";
import { addSpendSources } from "../../State/Slices/spendSourcesSlice";
import { generateNewKeyPair } from "../../Api/helpers";
import { nip19 } from "nostr-tools";
import { SourceTrustLevel } from "../../globalTypes";

const NodeUp = () => {
  const router = useIonRouter();




  const dispatch = useDispatch();
  const paySources = useSelector((state) => state.paySource);
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








  const addBootStrapSources = async () => {
    if (Object.values(paySources.sources || {}).length !== 0 && Object.values(spendSources.sources || {}).length !== 0) {
      return;
    } else {
      const keyPair = generateNewKeyPair();
      const id = `${NOSTR_PUB_DESTINATION}-${keyPair.publicKey}`;

      const bootstrapBalance = "0";
      const nprofile = nip19.nprofileEncode({
        pubkey: NOSTR_PUB_DESTINATION,
        relays: NOSTR_RELAYS,
      })


      dispatch(addPaySources({
        source: {
          id: id,
          label: "Bootstrap Node",
          pasteField: nprofile,
          option: SourceTrustLevel.LOW,
          icon: "0",
          pubSource: true,
          keys: keyPair
        }
      }));
      dispatch(addSpendSources({
        source: {
          id: id,
          label: "Bootstrap Node",
          pasteField: nprofile,
          option: SourceTrustLevel.LOW,
          icon: "0",
          balance: bootstrapBalance,
          pubSource: true,
          keys: keyPair
        }
      }));
    }
  }

  return (
    <div className="NodeUp">
      <div className="NodeUp_title">Node Up</div>
      <div className="NodeUp_textBox">
        Continue to bootstrap the wallet with a trusted server, you may add a node later.<br /><br /><br />
        Add connection to link a node now, or recover from backup.
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

export default NodeUp;
