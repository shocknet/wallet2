import { useEffect, useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from "@ionic/react";
import { Message } from "./message";

interface messageHistory {
  time_stamp : number,
  chat : string,
  msg_type : string,
  file :string
}

export const Feat = () => {

  const router = useIonRouter();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState<messageHistory[]>([
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

  const fileDownload = (e: HTMLInputElement) => {
    setEditing(true);
    if (e.files) {
      const file = e.files[0];
      setMessage(file.name);
      if (file.type.includes("image")) {
        setFile(URL.createObjectURL(file));
      }
      document.getElementById("message")?.focus();
    }
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
        onKeyDown={(e) => {
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
          <div className="Feat_selectImage"></div>
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
      const blob = await clipboardItem.getType("image/png");
      setFile(URL.createObjectURL(blob));
      setEditing(true);
      setMessage(String(Date.now()) + ".png");
      // Do something with the image blob.
    }
  };

  
  const sendMessage = (selected: string) => {
    // console.log(MessageParser(message));
    console.log(message);
    console.log(selected);
    const scrollField = document.getElementById("HistoryFeild");
    if (scrollField) {
      setScroll(scrollField.scrollHeight);
    }
    if (selected == "normal") {
      if (file) {
        ActionProvider(message,"send_image",file)
      } else {
        ActionProvider(message,"send_message",file)
      }
    }

    if (selected == "/Send Payment") {
      ActionProvider(selected, "send_message",file)
    }

    if (selected == "/Create a Cloude Node") {
      ActionProvider(selected, "send_message", file);
    }

    if (selected == "/Is this private?") {
      ActionProvider(selected, "send_message", file);
    }
    MessageParser(messageHistory[messageHistory.length-1]);
    setMessageHistory(messageHistory);
    setEditing(false);
    setMessage("");
    setFile("");
  };

  const MessageParser = (message : messageHistory) => {
    const LowserMessage = message.chat.toLocaleLowerCase();
    
    if((LowserMessage.includes("hi") || LowserMessage.includes("li")) && (message.file == "" && LowserMessage != "/is this private?")){
      ActionProvider("Hi, I'm Alice. I'm here to help you explain how I work","recive_message",file)
      setMessageHistory(messageHistory);
    }
    if(LowserMessage.includes("tool")){
      ActionProvider("we provides this much features", "recive_message", file);
      ActionProvider("", "recive_button", file);
      setMessageHistory(messageHistory);
    }
    if(message.file){
      ActionProvider("This is Image File, What do you want?","recive_message",file)
      ActionProvider("", "recive_img_button", file);
      setMessageHistory(messageHistory);
    }
  }

  const ActionProvider = (chat:string, msg_type:string, file:string) => {
    messageHistory.push({
      time_stamp: Date.now(),
      chat: chat,
      msg_type: msg_type,
      file: file,
    });
  }

  return (
    <div className="Feat">
      <div className="Feat_header">
        <div className="Feat_Icon_Left">{Icons.arrowLeft()}</div>
        <div className="Feat_user">
          <img src="/feat/Oval.svg" width={28} height={28} alt="Oval" />
          <div className="Feat_user_name">Alice</div>
        </div>
      </div>
      <div className="Feat_body">
        <div className="Feat_container" id="HistoryFeild">
          <div>
            <div className="Feat_Msg_Image">
              <img src="/feat/Rectangle.svg" alt="Rectangle" />
            </div>
            {messageHistory.map((message, index) => {
              return (
                <Message
                  key={index}
                  content={message.chat}
                  type={message.msg_type}
                  file = {message.file}
                ></Message>
              );
              
            })}
          </div>
        </div>
        <div className="Feat_actions">
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
      </div>
    </div>
  );
};
