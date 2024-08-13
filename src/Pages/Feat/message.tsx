import * as Icons from "../../Assets/SvgIconLibrary";

interface Props {
  content: string;
  type: string;
  file: string;
}

export const Message = ({ content, type, file }: Props) => {
  if (type == "recive_message") {
    return (
      <div className="Feat_Msg_reciver">
        <div className="Feat_polygon_reciver">{Icons.Polygon()}</div>
        <div className="Feat_chat_reciver">{content}</div>
      </div>
    );
  }
  if (type == "recive_button") {
    return (
      <div className="Feat_Msg_reciver">
        <div className="Feat_bot_btn">
          <button>Send Payment</button>
          <button>Create a Cloud Node</button>
          <button>Is this private?</button>
        </div>
      </div>
    );
  }
  if (type == "recive_img_button") {
    return (
      <div className="Feat_Msg_reciver">
        <div className="Feat_bot_btn">
          <button style={{width:50}}>Scan</button>
        </div>
      </div>
    );
  }
  if (type == "send_message") {
    return (
      <div className="Feat_Msg_send">
        <div className="Feat_chat_send">{content}</div>
        <div className="Feat_polygon_send">{Icons.Polygon()}</div>
      </div>
    );
  }
  if (type == "send_image") {
    return (
      <div className="Feat_Msg_Image_send">
        <img src={file} alt="Rectangle" />
      </div>
    );
  }
};
