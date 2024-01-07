import React from "react";

export interface ChangeQuantityInterface {
  id: number;
  quantity: number
}

export interface RoutesInterface {
  current: string;
  history: string;
}

interface RatingInterface {
  rate: number;
  count: number;
}

export interface ItemInterface {
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

export interface StateInterface {
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
export interface sw_item {
  station?: string;
  changes?: string;
  stateIcon?: string;
  date?: string;
  priceImg: Function;
  price?: number;
  underline?: boolean;
}

export interface ModalProps {
  isShown: boolean;
  hide: () => void;
  modalContent: JSX.Element;
  headerText: string;
}

export interface ModalProps {
  isShown: boolean;
  hide: () => void;
  modalContent: JSX.Element;
}

export interface SwItemData {
  station?: string;
  changes?: string;
  stateIcon?: string;
  date?: string;
  priceImg: Function;
  price?: number;
  underline?: boolean;
}

export interface TransactionInterface {
  amount: string,
  memo: string,
  time: number,
  destination: string,
  inbound: boolean,
  confirm: any,
  invoice: string,
}

export interface NotifyItemData {
  header: string;
  icon: string;
  desc: string;
  date: number;
  link: string;
}

export interface ITotalAmount {
  subtotal: number;
  taxes: number;
  total: number;
}

export const totalAmountInitial: ITotalAmount = {
  subtotal: 0,
  taxes: 0,
  total: 0
}

export interface SpendFrom {
  id: number;
  label: string;
  pasteField: string;
  icon: string;
  balance: string;
  option: string;
  maxWithdrawable?: string; // Max sats payable to out of pub invoice
  disabled?: string // the error message
}

export interface PayTo {
  id: number;
  label: string;
  pasteField: string;
  option: string;
  icon: string;
}