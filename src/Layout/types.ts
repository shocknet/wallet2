import React from "react";
import { ActionType, StateInterface } from "../globalTypes";

export interface LayoutProps {
  children: JSX.Element,
  dispatch: React.Dispatch<ActionType>
}