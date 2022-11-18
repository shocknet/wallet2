import React from "react";
import { ActionType } from "../../globalTypes";

export interface ItemProps{
  id: number;
  name: string;
  category: string;
  price: number;
  rate: number;
  image: string;
  dispatch: React.Dispatch<ActionType>
  added: boolean
}