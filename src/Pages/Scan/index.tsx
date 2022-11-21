import React from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";

export const Scan: React.FC<PageProps> = (): JSX.Element => {

  const navigate: NavigateFunction = useNavigate()

  return(
    <div className="Scan">
      Scan
    </div>
  )
}