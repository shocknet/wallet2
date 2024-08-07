import React, { useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";

export const Feat = () => {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const defaultIcon = (
    <div className="Feat_defaultIcon">
      <input
        type="text"
        placeholder="Message"
        id="message"
        className="Message"
        onChange={(e) => editingMessage(e.target.value)}
      />
      <img src="/feat/attach.svg" width={24} height={24} alt="refresh" />
      <img src="/feat/cam.svg" width={24} height={24} alt="refresh" />
    </div>
  );

  const sendIcon = (
    <div className="Feat_sendIcon">
      <input
        type="text"
        placeholder="Message"
        id="message"
        className="Message"
        onChange={(e) => editingMessage(e.target.value)}
      />
      <img src="/feat/send.svg" width={24} height={24} alt="refresh" />
    </div>
  );

  const editingMessage = (message: string) => {
    setMessage(message);
    if (message.length != 0) {
      setEditing(true);
    } else {
      setEditing(false);
    }
  };

  return (
    <div className="Feat">
      <div className="Feat_header">
        <div className="Feat_Icon_Left">{Icons.arrowLeft()}</div>
        <div className="Feat_user">
          <img src="/feat/Oval.svg" width={28} height={28} alt="Oval" />
          <div className="Feat_user_name">Alice</div>
        </div>
      </div>
      <div className="Feat_container">
        <div className="Feat_Msg_Image">
          <img src="/feat/Rectangle.svg" alt="Rectangle" />
        </div>
        <div className="Feat_Msg">
          Hey there, I'm Alice!
          <br />
          <br />
          I'm your wallet assistant and an expert with Bitcoin's Lightning
          Network...
          <br />
          <br />I can set-up a cloud node, open a channel, make a payment,
          pretty much anything you like... Just ask!
          <br />
          <br />
          So, how can I help you today?
        </div>
      </div>
      <div className="Feat_more_tools">
        <button>Send Payment</button>
        <button>Create a Cloud Node</button>
        <button>Is this private?</button>
        <img src="/feat/refresh (2).svg" width={24} height={24} alt="refresh" />
      </div>

      <div className="Feat_edit_message">
        <img src="/feat/refresh.svg" width={24} height={24} alt="refresh" />
        {!editing ? defaultIcon : sendIcon}
      </div>
    </div>
  );
};
