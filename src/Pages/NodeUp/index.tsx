import React from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";

export const NodeUp: React.FC<PageProps> = (): JSX.Element => {

  const navigate: NavigateFunction = useNavigate()

  return(
    <div className="NodeUp">
      <div className="NodeUp_title">Node Up</div>
      <div className="NodeUp_textBox">
        "Continue" to bootstrap the wallet with a trusted server and add a node later<br/><br/><br/>
        "Add connection" to link a node now.
      </div>
      <div className="NodeUp_manual">
        <div onClick={() => { navigate("/sources")} } className="NodeUp_manual_text">
          Add Connection
        </div>
        <div className="NodeUp_manual_btn">
          <button onClick={() => { navigate("/loader") }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}