import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { SpendFrom } from '../../globalTypes';

const initialState: SpendFrom[] =  [];

const spendSourcesSlice = createSlice({
  name: 'spendSources',
  initialState,
  reducers: {
    addSpendSources: (state, action: PayloadAction<SpendFrom>) => {
      state.push(action.payload);
    },
    editSpendSources: (state, action: PayloadAction<SpendFrom>) => {
      const id = action.payload.id;
      state[id] = action.payload;
    },
    deleteSpendSources: (state, action: PayloadAction<number>) => {
      state.splice(action.payload, 1)
    },
  },
});

export const { addSpendSources, editSpendSources, deleteSpendSources } = spendSourcesSlice.actions;
export default spendSourcesSlice.reducer;
