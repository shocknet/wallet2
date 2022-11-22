import React, { useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import QrReader from "react-qr-reader";
import { PageProps } from "../../globalTypes";

import Close from "../../Assets/Icons/ScanClose.svg";

export const Scan: React.FC<PageProps> = (): JSX.Element => {

  const navigate: NavigateFunction = useNavigate();

  const [itemInput, setItemInput] = useState("");
  const [result, setResult] = useState("no result");
  const [error, setError] = useState(null);

  if (error) {
    return <div className="error">{error}</div>;
  }

  return(
    <div className="Scan">
      <div onClick={() => { navigate("/home")} } className="Scan_back">
        <img src={Close} width="80px" alt="" />
      </div>
      <div className="Scan_scanner">
      <QrReader
        delay={300}
        onError={(error) => {
          setError(error.message);
          alert("Error: " + error.message);
          navigate("/home");
        }}
        onScan={(data) => {
          if (data) {
            setResult(data);
            setError(null);
            alert("Scaned: " + data);
            navigate("/home");
          }
        }}
        style={{ width: "100%" }}
      />
      </div>
      <div className="Scan_result_input">
        <input
          type="text"
          onChange={(e) => setItemInput(e.target.value)}
          value={itemInput || "Or paste from clipboard..."}
        />    
      </div>
    </div>
  )
}