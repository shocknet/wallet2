import React from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";

import Back from "../../Assets/Icons/QRScanBack.jpeg";

export const Scan: React.FC<PageProps> = (): JSX.Element => {

  const navigate: NavigateFunction = useNavigate()

  return(
    <div className="Scan">
      <div className="Scan_back_img">
        <img src={Back} width="100%" height="100%" alt="" />
      </div>
    </div>
  )
}