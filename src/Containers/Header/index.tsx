import React, { Fragment, useContext, useRef } from "react";
// images and/or icons
import Logo from "../../Assets/Images/logo.png";
import Menu from "../../Assets/Icons/menu.svg";
import Cart from "../../Assets/Icons/cart.svg";
import ArrowLeft from "../../Assets/Icons/arrow-left.svg";

import { HeaderProps } from "./types";

// components
import { ButtonSmall } from "../../Components/ButtonSmall";

// constants
import { locationRegex } from "../../constants";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { Filter } from "../Filter";
import { Ctx } from "../../Context";

export const Header: React.FC<HeaderProps> = ({ dispatch }): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const state = useContext(Ctx)
  let { current, shoppingCart, history } = state



  const isNopeUp: boolean = window.location.pathname === "/";
  // const isMenu: boolean = window.location.pathname === "/menu";
  const isLoader: boolean = window.location.pathname === "/loader";
  const isManageSource: boolean = window.location.pathname.includes("manage-source");
 

  const renderMainHeader = (): JSX.Element => {
    return(
      <React.Fragment>
        {isManageSource ? (
          <ButtonSmall
            to={history}
            from={window.location.pathname}
            source={ArrowLeft}
            isCTA={true}
            dispatch={dispatch}
          />
        ) : (
          <button className="Header__logo" onClick={() => navigate("/")}>
            <img src={Logo} width="70px" alt="" />
          </button>
        )}
      </React.Fragment>
    )
  }

  return (
    <header className="Header">
      {(isNopeUp || isLoader) && window.screen.width < 700 ? (
        <React.Fragment>
          <button className="Header__logo_1" onClick={() => navigate("/")}>
            <img src={Logo} width="70px" alt="" />
          </button>
          <div className="Header_text">SHOCKWALLET</div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <button className="Header__logo_2" onClick={() => navigate("/")}>
            <img src={Logo} width="30px" alt="" />
          </button>
          <button className="Header__menu" onClick={() => navigate("#")}>
            <img src={Menu} width="40px" alt="" />
          </button>
        </React.Fragment>
      )}
    </header>
  )
}