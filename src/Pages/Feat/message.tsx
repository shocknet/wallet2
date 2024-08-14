import React, { useEffect, useState } from "react";
import { useSelector } from '../../State/store'; //import reducer
import * as Icons from "../../Assets/SvgIconLibrary";

interface Props {
  userResponse: string;
  botResponse: {
    purpose?: string;
    message?: string;
    options?: string[];
    sender?: string;
  };
  sendUserResponse: string;
  optionClick: (ev: React.MouseEvent<HTMLElement>) => void;
}

interface MessagesInfo {
  purpose?: string;
  message?: string;
  options?: string[];
  sender?: string;
}

export const Message: React.FC<Props> = props => {
  const [messages, setMessages] = useState<MessagesInfo[]>([]);

  //declaration about reducer
  const messageSource = useSelector((state) => state.messageSource);

  useEffect(() => {
      setMessages(messageSource.chats);
  }, [messageSource.chats]);

  return (
    <div className="message-container">
      {messages.map((chat) => (
        <div key={chat.message}>
          <div className={`message_${chat.sender}`} style={{display : `${chat.sender == "bot" ? "flex" : "none"}`}}>
            <p className="polygon">{Icons.Polygon()}</p>
            <p className="Bot_text">{chat.message}</p>
          </div>
          <div className={`message_${chat.sender}`} style={{display : `${chat.sender == "user" ? "flex" : "none"}`}}>
            <p className="Bot_text">{chat.message}</p>
            <p className="polygon">{Icons.Polygon()}</p>
          </div>
          {chat.options ? (
            <div className="options">
              {chat.options.map((option) => (
                <p
                  data-id={option}
                  key={option}
                  onClick={(e) => props.optionClick(e)}
                >
                  {option}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}