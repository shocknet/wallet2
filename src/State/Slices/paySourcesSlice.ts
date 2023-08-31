import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';

const initialState: PayTo[] = [];

const paySourcesSlice = createSlice({
  name: 'paySources',
  initialState,
  reducers: {
    addPaySources: (state: PayTo[], action: PayloadAction<PayTo>) => {
      state.push(action.payload);
    },
    editPaySources: (state: PayTo[], action: PayloadAction<PayTo>) => {
      const id = action.payload.id;
      state[id] = action.payload;
    },
    deletePaySources: (state, action: PayloadAction<number>) => {
      state.splice(action.payload, 1)
    },
    setPaySources: (state, action: PayloadAction<PayTo[]>) => {
      state = action.payload;
    },
  },
});

export const { addPaySources, editPaySources, deletePaySources, setPaySources } = paySourcesSlice.actions;
export default paySourcesSlice.reducer;
