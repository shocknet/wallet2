import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Destination } from '../../constants';
export type SubscriptionPrice = { type: 'cents' | 'sats', amt: number }
export type Subscription = {
  subId: string
  periodSeconds: number
  subbedAtUnix: number
  price: SubscriptionPrice
  destionation: Destination
}
export type SubscriptionPayment = {
  subId: string
  operationId: string
  periodNumber: number
  periodStartUnix: number
  periodEndUnix: number
  paidSats: number
}
interface Subscriptions {
  activeSubs: Subscription[]
  inactiveSubs: (Subscription & { unsubbedAtUnix: number, unsubReason: 'cancel' | 'expire' })[]
  payments: Record<string, SubscriptionPayment[]>
}

const update = (value: Subscriptions) => {
  const save = JSON.stringify(value)
  localStorage.setItem("subscriptions", save);
}
const subsLocal = localStorage.getItem("subscriptions");
const iState: Subscriptions = { activeSubs: [], inactiveSubs: [], payments: {} };
const initialState: Subscriptions = JSON.parse(subsLocal ?? JSON.stringify(iState));

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
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
    removeActiveSub: (state, action: PayloadAction<{ subId: string, unsubReason: 'cancel' | 'expire' }>) => {
      const { subId, unsubReason } = action.payload
      const existingIndex = state.activeSubs.findIndex(s => s.subId === subId)
      if (existingIndex === -1) {
        console.log("tried to delete non existing Sub")
        return
      }
      const [removed] = state.activeSubs.splice(existingIndex, 1)
      state.inactiveSubs.push({ ...removed, unsubbedAtUnix: Math.floor(Date.now() / 1000), unsubReason })
      update(state)
    },
  }
});

export const { updateActiveSub, addSubPayment, removeActiveSub } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
