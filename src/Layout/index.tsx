import React from "react";
import { Header } from "../Containers/Header";
import { Footer } from "../Containers/Footer";
import { LayoutProps } from "./types";

export const Layout: React.FC<LayoutProps> = ({ children }): JSX.Element => {
  return(
    <React.Fragment>
      <Header />
        {children}
      <Footer />
    </React.Fragment>
  )
}