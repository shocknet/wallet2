import { toast } from "react-toastify";
import * as Icons from "../../Assets/SvgIconLibrary";
import { Clipboard } from "@capacitor/clipboard";
import { useState } from "react";

const sampleData =
  "nprofile1qqswxpkytms203mj2s83mjytqrme6tfezzlagpr7jyzcfxvda8y790sprfmhxue69uhhxarjvee8jtnndphkx6ewdejhgam0wf4sx3je57:f08273120169c027e1740c641d3a42b4c6a0776ead7d8ee551e8af61b2495e4e";

export const Offers = () => {

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [offers, setOffers] = useState<string>(sampleData);

  const CopyToClipboard = async () => {
    let clipbaordStr = "";
    clipbaordStr = offers;
    await Clipboard.write({
      string: clipbaordStr,
    });
    toast.success("Copied to clipboard")
  }

  return (
    <div className="Offers_container">
      <div className="Offers">
        <div className="Offers_header_text">Static Payment Offers</div>
        <div className="Offers_item">
          <div className="item_title">
            <img src="/SN_avatar.svg" alt="logo" />
            Bootstrap Node
          </div>
          <div className="RightIcon">{Icons.ChevronRightIcon()}</div>
        </div>
        <div className="Offers_source">
          <div className="source_header">
            <div className="title">Default Offers</div>
            <div className="edit_icon" onClick={()=>{setIsEdit(!isEdit);}}>{Icons.pencilIcons()}</div>
          </div>
          {!isEdit ? (
            <div className="source_data">{offers}</div>
          ) : (
            <div className="edit_source">
              <input value={offers} type="text" onChange={(e)=>{setOffers(e.target.value)}} />
            </div>
          )}
          <div className="source_footer">
            <div className="title">Spontaneous Payments</div>
            <div className="CopyIcon" onClick={CopyToClipboard}>
              {Icons.combindIcon()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
