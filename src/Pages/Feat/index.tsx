import { useEffect, useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from "@ionic/react";

export const Feat = () => {
  // const messageData = [
  //   {
  //     time_stamp: Date.now(),
  //     chat: "Hey there, I'm Alice! I'm your wallet assistant and an expert with Bitcoin's Lightning Network... I can set-up a cloud node, open a channel, make a payment, pretty much anything you like... Just ask! So, how can I help you today?",
  //     msg_type: "recive_message",
  //     file: "",
  //   },
  // ];

  const router = useIonRouter();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState([
    {
      time_stamp: Date.now(),
      chat: "Hey there, I'm Alice! I'm your wallet assistant and an expert with Bitcoin's Lightning Network... I can set-up a cloud node, open a channel, make a payment, pretty much anything you like... Just ask! So, how can I help you today?",
      msg_type: "recive_message",
      file: "",
    },
  ]);
  const [file, setFile] = useState("");
  const [scroll, setScroll] = useState(0);
  const [firstKey, setfirstKey] = useState("");

  useEffect(() => {
    const scrollField = document.getElementById("HistoryFeild");
    scrollField?.scrollTo(0, scroll);
  }, [scroll]);

  const sendMessage = (selected: string) => {
    console.log(selected);
    const scrollField = document.getElementById("HistoryFeild");
    setScroll(scrollField.scrollHeight);
    if (selected == "normal") {
      if (file) {
        messageHistory.push({
          time_stamp: Date.now(),
          chat: message,
          msg_type: "send_image",
          file: file,
        });
      } else {
        messageHistory.push({
          time_stamp: Date.now(),
          chat: message,
          msg_type: "send_message",
          file: "",
        });
      }
    }

    if (selected == "/Send Payment") {
      messageHistory.push({
        time_stamp: Date.now(),
        chat: selected,
        msg_type: "send_message",
        file: "",
      });
    }

    if (selected == "/Create a Cloude Node") {
      messageHistory.push({
        time_stamp: Date.now(),
        chat: selected,
        msg_type: "send_message",
        file: "",
      });
    }

    if (selected == "/Is this private?") {
      messageHistory.push({
        time_stamp: Date.now(),
        chat: selected,
        msg_type: "send_message",
        file: "",
      });
    }
    setMessageHistory(messageHistory);
    setEditing(false);
    setMessage("");
    setFile("");
  };

  const fileDownload = (e: HTMLInputElement) => {
    setEditing(true);
    const file = e.files[0];
    setMessage(file.name);
    if (file.type.includes("image")) {
      setFile(URL.createObjectURL(file));
    }
    document.getElementById("message")?.focus();
  };

  const editingMessage = (message: string) => {
    setMessage(message);
    if (message.length != 0) {
      setEditing(true);
    } else {
      setEditing(false);
    }
  };

  const defaultIcon = (
    <div className="Feat_defaultIcon">
      <input
        type="text"
        placeholder="Message"
        id="message"
        className="Message"
        onChange={(e) => editingMessage(e.target.value)}
        onKeyDownCapture={(e) => {
          if (e.key == "Control") setfirstKey("Control");
          if (e.key == "v") {
            if (firstKey == "Control") {
              console.log("copy");
              pastImage();
              setfirstKey("");
            }
          }
        }}
        value={message}
      />
      <div className="Feat_inputFile">
        <input
          type="file"
          width={24}
          onChange={(e) => fileDownload(e.target)}
        />
      </div>
      <button>{Icons.attachIcon()}</button>
      <button
        onClick={() => {
          router.push("/scan");
        }}
      >
        {Icons.camIcon()}
      </button>
    </div>
  );

  const sendIcon = () => {
    if (file) {
      return (
        <div className="Feat_sendIcon">
          <input
            type="text"
            placeholder="Message"
            id="message"
            className="Message"
            onChange={(e) => editingMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == "Enter") {
                sendMessage("normal");
              }
            }}
            value={message}
          />
          <div className="Feat_selectImage">
            <img src={file} alt="image" />
          </div>
          <button onClick={() => sendMessage("normal")}>
            {Icons.sendIcon()}
          </button>
        </div>
      );
    } else {
      return (
        <div className="Feat_sendIcon">
          <input
            type="text"
            placeholder="Message"
            id="message"
            className="Message"
            onChange={(e) => editingMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == "Enter") {
                sendMessage("normal");
              }
            }}
            value={message}
          />
          <div className="Feat_selectImage">
          </div>
          <button onClick={() => sendMessage("normal")}>
            {Icons.sendIcon()}
          </button>
        </div>
      );
    }
  };

  const send_payment = () => {
    sendMessage("/Send Payment");
    // editingMessage("/Send Payment");
    // document.getElementById("message")?.focus();
  };
  const create_cloud = () => {
    sendMessage("/Create a Cloude Node");
  };
  const is_this_private = () => {
    sendMessage("/Is this private?");
  };

  const pastImage = async () => {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      console.log(clipboardItem);
      console.log(clipboardItem.types);
      const imageTypes = clipboardItem.types.find((type) =>
        type.startsWith("image/")
      );
      const blob = await clipboardItem.getType(imageTypes);
      console.log(URL.createObjectURL(blob));
      setFile(URL.createObjectURL(blob));
      setEditing(true);
      setMessage(String(Date.now()) + ".png");
      // Do something with the image blob.
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
      <div className="Feat_container" id="HistoryFeild">
        <div>
          <div className="Feat_Msg_Image">
            <img src="/feat/Rectangle.svg" alt="Rectangle" />
          </div>
          {messageHistory.map((message, index) => {
            if (message.msg_type == "recive_message") {
              return (
                <div className="Feat_Msg_reciver" key={index}>
                  <div className="Feat_polygon_reciver">{Icons.Polygon()}</div>
                  <div className="Feat_chat_reciver">{message.chat}</div>
                </div>
              );
            }
            if (message.msg_type == "send_message") {
              return (
                <div className="Feat_Msg_send" key={index}>
                  <div className="Feat_chat_send">{message.chat}</div>
                  <div className="Feat_polygon_send">{Icons.Polygon()}</div>
                </div>
              );
            }
            if (message.msg_type == "send_image") {
              return (
                <div className="Feat_Msg_Image_send" key={index}>
                  <img src={message.file} alt="Rectangle" />
                </div>
              );
            }
          })}
        </div>
      </div>
      {/* <img src={captureImage} alt="" /> */}
      <div className="Feat_more_tools">
        <button onClick={send_payment}>Send Payment</button>
        <button onClick={create_cloud}>Create a Cloud Node</button>
        <button onClick={is_this_private}>Is this private?</button>
        <div onClick={pastImage}>{Icons.refreshIcon()}</div>
      </div>
      <div className="Feat_edit_message">
        {Icons.markIcon()}
        {!editing ? defaultIcon : sendIcon()}
      </div>
    </div>
  );
};
