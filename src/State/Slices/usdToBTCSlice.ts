import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { usdToBTCBuyLink, usdToBTCSellLink } from '../../constants';
import axios from 'axios';

interface Price {
    buyPrice: number,
    sellPrice: number,
};

const priceLocal = localStorage.getItem("price");

const update = (value: Price) => {
  localStorage.setItem("price", JSON.stringify(value));
}

const initialState: Price = JSON.parse(priceLocal??"[]");

const usdToBTCSlice = createSlice({
  name: 'usdToBTC',
  initialState,
  reducers: {
    setAmount: (state, action: PayloadAction<Price>) => {
        state = action.payload;
        update(state)
    },
  },
});

export const { setAmount } = usdToBTCSlice.actions;
export default usdToBTCSlice.reducer;
