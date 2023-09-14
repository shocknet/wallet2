import React, { useEffect } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { PageProps } from "../../globalTypes";
import { useSelector, useDispatch } from 'react-redux';

export const NodeUp: React.FC<PageProps> = (): JSX.Element => {


  //declaration about reducer
  const paySources = useSelector((state:any) => state.paySource).map((e:any)=>{return {...e}});
  
  const spendSources = useSelector((state:any) => state.spendSource).map((e:any)=>{return {...e}});

  const navigate: NavigateFunction = useNavigate();

  const toMainPage = () => {
    const loader = localStorage.getItem("loader");
    if (loader === "true") {
      navigate("/home");
    }else {
      navigate("/loader")
    }
  };

  useEffect(() => {
    if(paySources.length!==0||spendSources.length!==0){
      navigate("/home")
    }
  }, []);

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
          <button onClick={() => { toMainPage() }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}