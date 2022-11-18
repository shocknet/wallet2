import React from "react";
import { useNavigate } from "react-router-dom";
import { ButtonSmallProps } from "./types";

export const ButtonSmall: React.FC<ButtonSmallProps> = ({ 
  source,
  to,
  from,
  onclick,
  dependencies,
  isCTA,
  dispatch
}): JSX.Element => {

  const navigate = useNavigate()
  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if(onclick) onclick(e)
    if(to){
      dispatch && dispatch({ 
        type: "MOVING",
        payload: {current: to as string, history: from as string}
      })
      navigate(to)
    }
  }

  return(
    <button onClick={handleClick} className={`Button-small ${isCTA && "cta"}`}>
      {dependencies ? (
        <React.Fragment>
          {dependencies > 0 && (
            <span className="Button-small__notification"></span>
          )}
        </React.Fragment>
      ) : (
        null
      )}
      <img src={source} alt="" />
    </button>
  )
}