import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { TransactionInterface } from '../../globalTypes';


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