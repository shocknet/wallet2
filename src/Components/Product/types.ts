import { ActionType } from "../../globalTypes";

export interface ProductProps{
  title: string;
  price: number;
  quantity: number;
  img: string;
  dispatch: React.Dispatch<ActionType>;
  id: number,
}