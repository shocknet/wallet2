import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { usdToBTCBuyLink, usdToBTCSellLink } from '../../constants';
import axios from 'axios';

interface Price {
    buyPrice: number,
    sellPrice: number,
};

const getPrice = async () => {
    const buyInfo = await axios.get<any>(
      usdToBTCBuyLink,
      {
        headers: {
          Accept: 'application/json',
        }
      }
    );
    const sellInfo = await axios.get<any>(
      usdToBTCSellLink,
      {
        headers: {
          Accept: 'application/json',
        }
      }
    );
    
    return {
        buyPrice: buyInfo.data.data.amount,
        sellPrice: sellInfo.data.data.amount
    } as Price
}
const initialState: Price = await getPrice();

const usdToBTCSlice = createSlice({
  name: 'usdToBTC',
  initialState,
  reducers: {
    setAmount: (state, action: PayloadAction<Price>) => {
        state = action.payload;
    },
  },
});

export const { setAmount } = usdToBTCSlice.actions;
export default usdToBTCSlice.reducer;
