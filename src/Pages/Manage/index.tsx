import React, { useEffect, useMemo, useState } from "react";
import { useIonRouter } from "@ionic/react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector } from "../../State/store";
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";
import { getHttpClient, getNostrClient } from '../../Api';

export const Manage = () => {
  const router = useIonRouter();

  const [isShowQuestion, setIsShowQuestion] = useState<boolean>(false);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [seed, setSeed] = useState<string[]>([])
  const [nodeName, setNodeName] = useState<string>("");
  const [specificNostr, setSpecificNostr] = useState<string>("");
  const [isNodeDiscover, setIsNodeDiscover] = useState<boolean>(true);
  const [isDefaultManage, setIsDefaultManage] = useState<boolean>(true);
  const [isAutoService, setIsAutoService] = useState<boolean>(true);
  const [isRecoveryKey, setIsRecoveryKey] = useState<boolean>(true);
  const spendSources = useSelector(state => state.spendSource)
  const selectedSource = useMemo(() => {
    return spendSources.order.find(p => !!spendSources.sources[p].adminToken)
  }, [spendSources])
  const seeditems: string[] = [
    "albert",
    "biscuit",
    "carrot",
    "daisy",
    "elephant",
    "fruit",
    "albert",
    "biscuit",
    "carrot",
    "daisy",
    "elephant",
    "fruit",
    "albert",
    "biscuit",
    "carrot",
    "daisy",
    "elephant",
    "fruit",
    "albert",
    "fruit",
  ];

  const fetchSeed = async () => {
    if (!isRevealed) {
      setIsRevealed(true);
      if (!selectedSource) {
        toast.error(
          <Toast title="Metrics Error" message={`no admin access found`} />
        );
        return;
      }
      const source = spendSources.sources[selectedSource];
      if (!source || !source.adminToken) {
        toast.error(
          <Toast title="Metrics Error" message={`no admin access found`} />
        );
        return;
      }
      const client = await getNostrClient(source.pasteField, source.keys!);
      const res = await client.GetSeed();
      if (res.status !== "OK") {
        toast.error(
          <Toast
            title="Metrics Error"
            message={`failed to fetch seed ${res.reason}`}
          />
        );
        return;
      }
      setSeed(res.seed);
    } else {
      setIsRevealed(false);
    }
  }
  const handleSave = () => {
    router.push("/metrics");
  };

  const questionContent = (
    <React.Fragment>
      <div className="question-content">
        <div>
          Automation helps reduce the fees you pay by trusting peers temporarily
          until your node balance is sufficient to open a balanced Lightning
          channel.
        </div>
        <a
          href="https://docs.shock.network/"
          target="_blank"
          className="marked"
        >
          Learn More
        </a>
        <div
          className="icon-button close-button"
          onClick={() => setIsShowQuestion(false)}
        >
          {Icons.closeQuestion()}
        </div>
      </div>
    </React.Fragment>
  );
  return (
    <div className="Manage">
      <div className="Manage_settings">
        <div className="section-title">
          <div>
            <span>🌐</span> Nostr Settings
          </div>
          <div className="line" />
        </div>
        <div className="input-group">
          <div className="bg-over"></div>
          <span>Node name, seen by wallet users (Nostr):</span>
          <input type="text" placeholder="Nodey McNodeFace" value={nodeName} onChange={(e) => { setNodeName(e.target.value) }} />
        </div>
        <div className="checkbox">
          <div className="bg-over"></div>
          <input type="checkbox" id="nodeDiscoverable" checked={isNodeDiscover} onChange={() => { setIsNodeDiscover(!isNodeDiscover) }} />
          <div className="checkbox-shape"></div>
          <label htmlFor="nodeDiscoverable">
            Make node discoverable for public use. If unchecked, new users will
            require an invitation.
          </label>
        </div>
        <div className="hidden-part">
          <div className="bg-over"></div>
          <div className="input-group">
            <span>If you want to use a specific Nostr relay,</span>
            <input
              type="text"
              placeholder="wss://relay.lightning.pub"
              value={specificNostr}
              onChange={(e) => { setSpecificNostr(e.target.value) }}
            />
          </div>
          <div className="checkbox">
            <input type="checkbox" id="managedRelay" checked={isDefaultManage} onChange={() => { setIsDefaultManage(!isDefaultManage) }} />
            <div className="checkbox-shape"></div>
            <label htmlFor="managedRelay">
              Use the default managed relay service and auto-pay 1000 sats per
              month to support developers
            </label>
          </div>
        </div>
      </div>
      <div className="Manage_automation">
        <div className="section-title">
          <div>
            <span>
              <img
                src="/icons/lightning_yellow.png"
                width={15}
                height={15}
                alt=""
              />
            </span>{" "}
            Automation
          </div>
          <div className="line" />
        </div>
        <div className="checkbox">
          <div className="bg-over"></div>
          <input type="checkbox" id="automationService" checked={isAutoService} onChange={() => { setIsAutoService(!isAutoService) }} />
          <div className="checkbox-shape"></div>
          <label htmlFor="automationService" style={{ fontSize: 14 }}>
            Use Automation Service
          </label>
          <button
            className="Sources_question_mark"
            onClick={() => setIsShowQuestion(true)}
          >
            {Icons.questionMark()}
          </button>
        </div>
        {isShowQuestion && questionContent}
      </div>
      <div className="Manage_recoveryKeys">
        <div className="section-title">
          <div>
            <span>😰</span> Recovery Keys
          </div>
          <div className="line" />
        </div>
        <div className="checkbox">
          <div className="bg-over"></div>
          <input type="checkbox" id="channelBackup" checked={isRecoveryKey} onChange={() => { setIsRecoveryKey(!isRecoveryKey) }} />
          <div className="checkbox-shape"></div>
          <label htmlFor="channelBackup" style={{ fontSize: 14 }}>
            Channel Backup to Nostr Relay
          </label>
          <button
            className="Sources_question_mark"
            onClick={() =>
              window.open("https://docs.shock.network/pub/intro", "_blank")
            }
          >
            {Icons.questionMark()}
          </button>
        </div>
      </div>
      <div className="Manage_reveal-seed">
        <div
          onClick={() => setIsRevealed(true)}
          className={`text-box ${!isRevealed && "blur"}`}
        >
          {isRevealed
            ? seed.map((item: string, index: number) => (
              <div key={index} className="item">{`${index + 1
                }. ${item}`}</div>
            ))
            : seeditems.map((item: string, index: number) => (
              <div key={index} className="item">{`${index + 1
                }. ${item}`}</div>
            ))}
        </div>
        <div onClick={() => fetchSeed()} className="reveal-button">
          {isRevealed ? "Click to hide seed" : "Click to reveal seed"}
        </div>
      </div>
      <button onClick={handleSave} className="Manage_save">
        Save
      </button>
      <div className="Manage_footer">
        Connected to <br />
        {spendSources.sources[selectedSource || ""].pasteField}
      </div>
    </div>
  );
};
