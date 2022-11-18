import React from "react";
import { To } from "react-router-dom";
import { ActionType, StateInterface } from "../../globalTypes";

export interface ButtonSmallProps{
  source: string;
  dependencies?: string | number;
  to?: To;
  from?: string;
  onclick?: React.MouseEventHandler<HTMLButtonElement>;
  isCTA?: boolean;
  dispatch?: React.Dispatch<ActionType>;
}