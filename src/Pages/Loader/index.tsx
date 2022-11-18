import React from "react";
import { PageProps, ActionType } from "../../globalTypes";

export const Loader: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {

  return(
    <section className="Cart">
      <span className="Cart__msg">test</span>
    </section>
  )
}