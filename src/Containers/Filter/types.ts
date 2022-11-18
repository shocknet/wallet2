import React from "react";
import { ActionType, StateInterface } from "../../globalTypes";

export interface FilterProps{
  dispatch: React.Dispatch<ActionType>,
  isInHeader?: boolean
}