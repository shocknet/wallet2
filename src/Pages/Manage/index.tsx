import React, { useState } from "react";
import { useIonRouter } from "@ionic/react";
import * as Icons from "../../Assets/SvgIconLibrary";

interface Seeditem {
  id: number;
  node: string;
}

export const Manage = () => {
  const router = useIonRouter();

  const [isShowQuestion, setIsShowQuestion] = useState<boolean>(false);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const seeditems: Seeditem[] = [
    {
      id: 1,
      node: "albert",
    },
    {
      id: 2,
      node: "biscuit",
    },
    {
      id: 3,
      node: "carrot",
    },
    {
      id: 4,
      node: "daisy",
    },
    {
      id: 5,
      node: "elephant",
    },
    {
      id: 6,
      node: "fruit",
    },
    {
      id: 7,
      node: "albert",
    },
    {
      id: 8,
      node: "biscuit",
    },
    {
      id: 9,
      node: "carrot",
    },
    {
      id: 10,
      node: "daisy",
    },
    {
      id: 11,
      node: "elephant",
    },
    {
      id: 12,
      node: "fruit",
    },
    {
      id: 13,
      node: "albert",
    },
    {
      id: 14,
      node: "biscuit",
    },
    {
      id: 15,
      node: "carrot",
    },
    {
      id: 16,
      node: "daisy",
    },
    {
      id: 17,
      node: "elephant",
    },
    {
      id: 18,
      node: "fruit",
    },
    {
      id: 19,
      node: "albert",
    },
    {
      id: 20,
      node: "biscuit",
    },
    {
      id: 21,
      node: "carrot",
    },
    {
      id: 22,
      node: "daisy",
    },
    {
      id: 23,
      node: "elephant",
    },
    {
      id: 24,
      node: "fruit",
    },
  ];

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
          <span>Node name, seen by wallet users (Nostr):</span>
          <input type="text" placeholder="Nodey McNodeFace" value="" />
        </div>
        <div className="checkbox">
          <input type="checkbox" id="nodeDiscoverable" />
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
              value=""
            />
          </div>
          <div className="checkbox">
            <input type="checkbox" id="managedRelay" />
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
          <input type="checkbox" id="automationService" />
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
          <input type="checkbox" id="channelBackup" />
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
          {seeditems.map((item: Seeditem, index: number) => (
            <div key={index} className="item">{`${item.id}. ${item.node}`}</div>
          ))}
        </div>
        <div onClick={() => setIsRevealed(true)} className="reveal-button">
          Click to reveal seed
        </div>
      </div>
      <button onClick={handleSave} className="Manage_save">
        Save
      </button>
      <div className="Manage_footer">
        Connected to <br />
        npub123456
      </div>
    </div>
  );
};
