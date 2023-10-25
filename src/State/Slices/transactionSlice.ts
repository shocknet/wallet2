import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface TransactionInterface {
  amount: string,
  memo: string,
  time: string,
  destination: string,
  chainLN: string,
  confirm: string,
}

const transaction = localStorage.getItem("transaction");

const update = (value: [TransactionInterface]) => {
  localStorage.setItem("transaction", JSON.stringify(value));
}

const initialState: [TransactionInterface] = JSON.parse(transaction??'[]');

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<TransactionInterface>) => {
      state.push(action.payload)
      update(state)
    },
  },
});

export const { addTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
