import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';


const getPayToLocal = localStorage.getItem("payTo");

const initialState: PayTo[] = JSON.parse(getPayToLocal ?? "[]");

const update = (value: PayTo[]) => {
  localStorage.setItem("payTo", JSON.stringify(value));
}

const paySourcesSlice = createSlice({
  name: 'paySources',
  initialState,
  reducers: {
    addPaySources: (state: PayTo[], action: PayloadAction<PayTo>) => {
      const newState = [...state, action.payload];
      update(newState);
      return newState;
    },
    editPaySources: (state: PayTo[], action: PayloadAction<PayTo>) => {
      const id = action.payload.id;
      const newState = state.map(s => s.id === id ? action.payload : s);
      update(newState);
      return newState;
    },
    deletePaySources: (state, action: PayloadAction<number>) => {
      const newState = state.filter(source => source.id !== action.payload);
      update(newState);
      return newState;
    },
    setPaySources: (state, action: PayloadAction<PayTo[]>) => {
      if (state.length !== action.payload.length) return;
      update(action.payload);
      return action.payload
    },
  },
});

export const { addPaySources, editPaySources, deletePaySources, setPaySources } = paySourcesSlice.actions;
export default paySourcesSlice.reducer;
