import React from "react";
import { Header } from "../Containers/Header";
import { Footer } from "../Containers/Footer";
import { LayoutProps } from "./types";

export const Layout: React.FC<LayoutProps> = ({ children, dispatch }): JSX.Element => {
  return(
    <React.Fragment>
      <Header dispatch={dispatch} />
      {children}
      <Footer dispatch={dispatch} />
    </React.Fragment>
  )
}