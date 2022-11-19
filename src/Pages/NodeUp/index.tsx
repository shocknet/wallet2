import React from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";

export const NodeUp: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {

  const navigate: NavigateFunction = useNavigate()

  const handleClick = () => {
    navigate("/loader")
  }

  return(
    <div className="NodeUp">
      <div className="NodeUp_title">Node Up</div>
      <div className="NodeUp_textBox">
        Bootstrap the wallet with a trusted server by chosing "Continue", you may add a node later<br/><br/><br/>
        To add a node now, use "Manual Connection"
      </div>
      <div className="NodeUp_manual">
        <div className="NodeUp_manual_text">
          Manulal Connection
        </div>
        <div className="NodeUp_manual_btn">
          <button onClick={handleClick}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}