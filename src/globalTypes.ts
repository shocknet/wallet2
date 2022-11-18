import React from "react";

export interface ChangeQuantityInterface{
  id: number;
  quantity: number
}

export interface RoutesInterface{
  current: string;
  history: string;
}

interface RatingInterface{
  rate: number;
  count: number;
}

export interface ItemInterface{
  id: number;
  category: string;
  description: string;
  image: string;
  price: number;
  rating: RatingInterface;
  title: string;
  quantity?: number;
  added?: boolean
}

export interface StateInterface{
  items: Array<ItemInterface>,
  filteredItems: Array<ItemInterface>,
  shoppingCart: Array<ItemInterface>,
  searching: string,
  categories: Array<string>,
  current: string,
  history: string,
  isSearching: boolean,
  filterAt: string,
  totalAmount: number,
  error: boolean,
  loading: boolean
}

export type ActionType = {
  type: string,
  payload?: 
    | ItemInterface[] 
    | string 
    | number 
    | ChangeQuantityInterface
    | RoutesInterface
}

export interface PageProps {
  state: StateInterface;
  dispatch?: React.Dispatch<ActionType>;
  ctx?: React.Context<StateInterface>
}