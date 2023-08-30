import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { SpendFrom } from '../../globalTypes';

const initialState: SpendFrom[] =  [
  {
    id: 5,
    label: "stacker.news",
    pasteField: "21mz66...",
    icon: "5",
    balance: "0",
  },
];

const spendSourcesSlice = createSlice({
  name: 'spendSources',
  initialState,
  reducers: {
    addSpendSources: (state, action: PayloadAction<SpendFrom>) => {
      state.push(action.payload);
    },
    editSpendSources: (state) => {
    },
    deleteSpendSources: (state) => {
    },
  },
});

export const { addSpendSources, editSpendSources, deleteSpendSources } = spendSourcesSlice.actions;
export default spendSourcesSlice.reducer;
