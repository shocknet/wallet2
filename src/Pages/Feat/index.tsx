import React, { useEffect, useRef, useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from "@ionic/react";
import { Message } from "./message";
import { useDispatch, useSelector } from "../../State/store"; //import reducer
import { addChat, allRemoveChat } from "../../State/Slices/messageSourceSlice";
import { ChatService } from "./ChatService";

interface ResponseBotObject {
  purpose?: string;
  message?: string;
  options?: string[];
  sender?: string;
}

interface MessagesInfo {
  purpose?: string;
  message?: string;
  options?: string[];
  sender?: string;
}

export const Feat = () => {
  const router = useIonRouter();
  const [editing, setEditing] = useState<boolean>(false);
  const [file, setFile] = useState<string>("");
  const [firstKey, setfirstKey] = useState<string>("");
  //declaration about reducer
  const dispatch = useDispatch();
  const messageSource = useSelector((state) => state.messageSource);

  const [userResponse, setUserResponse] = useState<string>("");
  const [botResponse, setBotResponse] = useState<ResponseBotObject>({
    purpose: "",
    message: "",
    sender: "bot",
  });
  const dummyRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [sendUserResponse, setSendUserResponse] = useState<string>("");
  const [isScrollDown, setIsScrollDown] = useState<boolean>(false);
  const [crtOptions, setCrtOptions] = useState<string[]>([]);
  const [isAllRemoveChat, setIsAllRemoveChat] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessagesInfo[]>([]);

  const initialData = {
    purpose: "introduction",
    message:
      "Hey there, I'm Alice! I'm your wallet assistant and an expert with Bitcoin's Lightning Network... I can set-up a cloud node, open a channel, make a payment, pretty much anything you like... Just ask! So, how can I help you today?",
    sender: "bot",
    options: ["Send Payment", "Create a Cloud Node", "Is this private"],
  };

  useEffect(() => {
    setMessages([
      {
        purpose: "introduction",
        message:
          "Hey there, I'm Alice! I'm your wallet assistant and an expert with Bitcoin's Lightning Network... I can set-up a cloud node, open a channel, make a payment, pretty much anything you like... Just ask! So, how can I help you today?",
        sender: "bot",
        options: ["Send Payment", "Create a Cloud Node", "Is this private"],
      },
    ]);
  }, [isAllRemoveChat]);

  useEffect(() => {
    setMessages(messageSource.chats);
  }, [messageSource.chats]);

  useEffect(() => {
    if (userResponse.length == 0) {
      setEditing(false);
      setFile("");
      setfirstKey("");
    }
  }, [userResponse]);

  useEffect(() => {
    setTimeout(() => {
      if (dummyRef && dummyRef.current && bodyRef && bodyRef.current) {
        bodyRef.current.scrollTo({
          top: dummyRef.current.offsetTop,
          behavior: "smooth",
        });
      }
    }, 1200);
  }, [isScrollDown]);

  const handleAllRemoveChat = async () => {
    await dispatch(allRemoveChat(initialData));
    await setIsAllRemoveChat(!isAllRemoveChat);
    await setCrtOptions(["Send Payment", "Create a Cloud Node", "Is this private"]);
  }

  useEffect(() => {
    const options = messageSource.chats[messageSource.chats.length - 1].options;
    if (options) {
      setCrtOptions(options);
    } else {
      setCrtOptions([]);
    }
  }, [messageSource.chats]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditing(true);
    setUserResponse(e.target.value);
  };

  const handleUserResponse = () => {
    setIsLoading(true);
    setIsScrollDown(!isScrollDown);
    handleBotResponse(userResponse);
  };

  const handleBotResponse =  (response: string) => {
    setIsScrollDown(!isScrollDown);
    setSendUserResponse(response);
    setTimeout(() => {
      dispatch(
        addChat({ sender: "user", message: response, purpose: "user_response" })
      );
      const res = ChatService(response.toLocaleLowerCase());
      setBotResponse({ ...res, sender: "bot" });
      dispatch(addChat({ ...res, sender: "bot" }));
      setIsLoading(false);
    }, 1000);
    setUserResponse("");
  };

  const optionClick = (e: React.MouseEvent<HTMLElement>) => {
    const option = e.currentTarget.dataset.id;
    console.log(option);
    if (option) {
      handleBotResponse(option);
    }
  };

  const fileDownload = (e: HTMLInputElement) => {
    setEditing(true);
    if (e.files) {
      const file = e.files[0];
      setUserResponse(file.name);
      if (file.type.includes("image")) {
        setFile(URL.createObjectURL(file));
      }
      document.getElementById("message")?.focus();
    }
  };

  const AfterEditingState = () => {
    if (file) {
      return (
        <>
          <div className="Feat_ChatMessageInputContaier_ShowImage">
            <img src={file} alt="image" />
          </div>
          <button onClick={handleUserResponse}>{Icons.sendIcon()}</button>
        </>
      );
    } else {
      return (
        <>
          <div className="Feat_ChatMessageInputContaier_ShowImage"></div>
          <button onClick={handleUserResponse}>{Icons.sendIcon()}</button>
        </>
      );
    }
  };

  const BeforeEditingState = () => {
    return (
      <>
        <div className="Feat_ChatMessageInputContainer_inputFile">
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
          {" "}
          {Icons.camIcon()}{" "}
        </button>
      </>
    );
  };

  const pasteImage = async () => {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      const blob = await clipboardItem.getType("image/png");
      setFile(URL.createObjectURL(blob));
      setEditing(true);
      setUserResponse(String(Date.now()) + ".png");
      // Do something with the image blob.
    }
  };

  return (
    <div className="Feat">
      <div className="Feat_ChatMessageHeader">
        <div className="Feat_Icon_Left">{Icons.arrowLeft()}</div>
        <div className="Feat_user">
          <img src="/feat/Oval.svg" width={28} height={28} alt="Oval" />
          <div className="Feat_user_name">Alice</div>
        </div>
      </div>
      <div className="Feat_ChatMessageBody">
        <div
          className="Feat_ChatMessageBody_Container"
          ref={bodyRef}
          id="HistoryFeild"
        >
          <div className="Feat_InfoBot_sectionContainer">
            <div className="Feat_Bot_Image">
              <img src="/feat/Rectangle.svg" alt="Rectangle" />
            </div>
          </div>
          <Message
            botResponse={botResponse}
            userResponse={userResponse}
            sendUserResponse={sendUserResponse}
            optionClick={optionClick}
            allRemoveChat = {isAllRemoveChat}
            message={messages}
          ></Message>
          <div className="loader-container" style={{display : `${isLoading ? "block" : "none"}`}}>
            <div className="bouncing-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
          </div>
          </div>
          <div ref={dummyRef} className="dummy-div"></div>
        </div>
      </div>
      <div className="Feat_ChatMessageFooter">
        <div className="options">
          {crtOptions.map((option, index) => (
            <div key={index}>
              <p
                data-id={option}
                key={option}
                // onClick={(e) => props.optionClick(e)}
              >
                {option}
              </p>
            </div>
          ))}
          <div className="clear_icon" onClick={handleAllRemoveChat}>{Icons.refreshIcon()}</div>
        </div>
        <div className="Feat_ChatMessageInputContainer">
          {Icons.markIcon()}
          <div className="Feat_ChatMessageInputContainer_input">
            <input
              type="text"
              placeholder="Message"
              id="message"
              className="Message"
              onChange={(e) => handleInputChange(e)}
              onKeyDown={(e) => {
                if (e.key == "Control") setfirstKey("Control");
                if (e.key == "v") {
                  if (firstKey == "Control") {
                    console.log("copy");
                    pasteImage();
                    setfirstKey("");
                  }
                }
                if (e.key == "Enter") {
                  handleUserResponse();
                }
              }}
              value={userResponse}
              disabled = {isLoading}
            />
            <div className="Feat_ChatMessageInputContainer_ChangeField">
              {!editing ? BeforeEditingState() : AfterEditingState()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
