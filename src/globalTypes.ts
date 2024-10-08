import React from "react";
import { NostrKeyPair } from "./Api/nostrHandler";
import { LiveDebitRequest } from "./Api/pub/autogenerated/ts/types";

type PriceImgFunction = (arg1: string, arg2: number) => string;

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
  priceImg: PriceImgFunction;
  price?: number;
  underline?: boolean;
}

export interface ModalProps {
  isShown: boolean;
  hide: () => void;
  modalContent: JSX.Element;
  headerText?: string;
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
  priceImg: PriceImgFunction;
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
  id: string;
  label: string;
  pasteField: string;
  icon: string;
  balance: string;
  option: SourceTrustLevel;
  maxWithdrawable?: string; // Max sats payable to out of pub invoice
  disabled?: string // the error message
  disconnected?: boolean;
  pubSource?: boolean,
  keys: NostrKeyPair
  adminToken?: string
  ndebit?: string
}

export interface PayTo {
  id: string;
  label: string;
  pasteField: string;
  option: SourceTrustLevel;
  icon: string;
  disconnected?: boolean
  vanityName?: string;
  pubSource?: boolean,
  keys: NostrKeyPair
  bridgeUrl?: string
  isNdebitDiscoverable?: boolean
}

export interface FiatCurrency {
  url: string;
  currency: string;
  symbol: string;
}

export enum SourceTrustLevel {
	HIGH = "😎 My node.",
	MEDIUM = "🫡 Well trusted.",
	LOW = "🤔 Little trust.",
}


export type SourceDebitRequest = { request: LiveDebitRequest, source: SpendFrom }