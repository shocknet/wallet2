import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface Price {
    buyPrice: number,
    sellPrice: number,
};

const priceLocal = localStorage.getItem("price");

const update = (value: Price) => {
  localStorage.setItem("price", JSON.stringify(value));
}

const initialState: Price = JSON.parse(priceLocal??"{}");

const usdToBTCSlice = createSlice({
  name: 'usdToBTC',
  initialState,
  reducers: {
    setAmount: (state, action: PayloadAction<Price>) => {
        state.buyPrice = action.payload.buyPrice;
        state.sellPrice = action.payload.sellPrice;
        update(state)
    },
  },
});

export const { setAmount } = usdToBTCSlice.actions;
export default usdToBTCSlice.reducer;
