import React from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";

export const NodeUp: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {

  const navigate: NavigateFunction = useNavigate()

  const handleClick = () => {
    navigate("/loader")
  }

  return(
    <div className="Home">
      <div className="Home_title">Node Up</div>
      <div className="Home_textBox">
        Bootstrap the wallet with a trusted server by chosing "Continue", you may add a node later<br/><br/><br/>
        To add a node now, use "Manual Connection"
      </div>
      <div className="Home_manual">
        <div className="Home_manual_text">
          Manulal Connection
        </div>
        <div className="Home_manual_btn">
          <button onClick={handleClick}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}