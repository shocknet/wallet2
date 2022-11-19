import React from "react";
import { ActionType } from "../globalTypes";

export interface LayoutProps {
  children: JSX.Element,
  dispatch: React.Dispatch<ActionType>
}