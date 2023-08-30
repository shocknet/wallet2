import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';

const initialState: PayTo[] = [
  {
    id: 5,
    label: "stacker",
    pasteField: "21mz66...",
    icon: "5",
  },
  {
    id: 1,
    label: "stacker.news",
    pasteField: "21mz66...",
    icon: "5",
  },
];

const paySourcesSlice = createSlice({
  name: 'paySources',
  initialState,
  reducers: {
    addPaySources: (state: PayTo[], action: PayloadAction<PayTo>) => {
      state.push(action.payload);
    },
    editPaySources: (state: PayTo[], action: PayloadAction<PayTo>) => {
      const id = action.payload.id;
      state[id!] = action.payload;
    },
    deletePaySources: (state) => {
    },
    setPaySources: (state, action: PayloadAction<PayTo[]>) => {
      state = action.payload;
    },
  },
});

export const { addPaySources, editPaySources, deletePaySources, setPaySources } = paySourcesSlice.actions;
export default paySourcesSlice.reducer;
