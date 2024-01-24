import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface Price {
  buyPrice: number,
  sellPrice: number,
}

const initialState: Price = { buyPrice: 0, sellPrice: 0 }

const usdToBTCSlice = createSlice({
  name: 'usdToBTC',
  initialState,
  reducers: {
    setAmount: (state, action: PayloadAction<Price>) => {
      state.buyPrice = action.payload.buyPrice;
      state.sellPrice = action.payload.sellPrice;
    },
  },
});

export const { setAmount } = usdToBTCSlice.actions;
export default usdToBTCSlice.reducer;
