import React, { useEffect, useState } from "react";
import { useSelector } from '../../State/store'; //import reducer
import * as Icons from "../../Assets/SvgIconLibrary";


interface MessagesInfo {
  purpose?: string;
  message?: string;
  options?: string[];
  sender?: string;
}

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
  allRemoveChat : boolean;
  message : MessagesInfo[]
}

export const Message: React.FC<Props> = props => {
  return (
    <div className="message-container">
      {props.message.map((chat) => (
        <div key={chat.message}>
          <div className={`message_${chat.sender}`} style={{display : `${chat.sender == "bot" ? "flex" : "none"}`}}>
            <p className="polygon">{Icons.Polygon()}</p>
            <p className="Bot_text">{chat.message}</p>
          </div>
          <div className={`message_${chat.sender}`} style={{display : `${chat.sender == "user" ? "flex" : "none"}`}}>
            <p className="Bot_text">{chat.message}</p>
            <p className="polygon">{Icons.Polygon()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}