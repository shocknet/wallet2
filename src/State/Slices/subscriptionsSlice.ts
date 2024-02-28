import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Destination } from '../../constants';
import { mergeArrayValues, mergeRecords } from './dataMerge';
import { Interval } from '../../Pages/Automation/newSubModal';
import { syncRedux } from '../store';
export type SubscriptionPrice = { type: 'cents' | 'sats', amt: number }
export type Subscription = {
  subId: string
  periodSeconds: number
  subbedAtUnix: number
  price: SubscriptionPrice
  destionation: Destination
  memo: string
  enabled: boolean
  interval: Interval
  unsubbedAtUnix?: number
  unsubReason?: 'cancel' | 'expire' | 'failure'
}
export type SubscriptionPayment = {
  subId: string
  operationId: string
  periodNumber: number
  periodStartUnix: number
  periodEndUnix: number
  paidSats: number
  fake?: boolean
}
export interface Subscriptions {
  activeSubs: Subscription[]
  payments: Record<string, SubscriptionPayment[]>
}
export const storageKey = "subscriptions"
export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  const local = JSON.parse(serialLocal) as Subscriptions
  const remote = JSON.parse(serialRemote) as Subscriptions
  const merged: Subscriptions = {
    activeSubs: mergeArrayValues(local.activeSubs, remote.activeSubs, v => v.subId),
    payments: mergeRecords(local.payments, remote.payments, (l, r) => mergeArrayValues(l, r, v => v.operationId))
  }
  return JSON.stringify(merged)
}
const update = (value: Subscriptions) => {
  const save = JSON.stringify(value)
  localStorage.setItem(storageKey, save);
}
const subsLocal = localStorage.getItem("subscriptions");
const iState: Subscriptions = { activeSubs: [], payments: {} };
const initialState: Subscriptions = JSON.parse(subsLocal ?? JSON.stringify(iState));

const subscriptionsSlice = createSlice({
  name: storageKey,
  initialState,
  reducers: {
    addSubPayment: (state, action: PayloadAction<{ payment: SubscriptionPayment }>) => {
      const { payment } = action.payload
      if (state.payments[payment.subId]) {
        state.payments[payment.subId].push(payment)
      } else {
        state.payments[payment.subId] = [payment]
      }
      update(state)
    },
    updateActiveSub: (state, action: PayloadAction<{ sub: Subscription }>) => {
      const { sub } = action.payload
      const existingIndex = state.activeSubs.findIndex(s => s.subId === sub.subId)
      if (existingIndex !== -1) {
        state.activeSubs[existingIndex] = sub
      } else {
        state.activeSubs.push(sub)
      }
      update(state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return JSON.parse(localStorage.getItem(storageKey) ?? JSON.stringify(iState));
    })
  }
});

export const { updateActiveSub, addSubPayment } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
