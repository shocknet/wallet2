import React from "react";
import { PageProps } from "../../globalTypes";

export const NopeUp: React.FC<PageProps> = ({}): JSX.Element => {

  return(
    <div className="Home">
      <div className="Home_title">Nope Up</div>
      <div className="Home_textBox">
        Bootstrap the wallet with a trusted server by chosing "Continue", you may add a node later<br/><br/><br/>
        To add a node now, use "Manual Connection"
      </div>
      <div className="Home_manual">
        <div className="Home_manual_text">
          Manulal Connection
        </div>
        <div className="Home_manual_btn">
          <button>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}