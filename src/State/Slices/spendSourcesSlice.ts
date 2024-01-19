import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { SpendFrom } from '../../globalTypes';

const getSpendFromLocal = localStorage.getItem("spendFrom");

const update = (value: SpendFrom[]) => {
  localStorage.setItem("spendFrom", JSON.stringify(value));
}

const initialState: SpendFrom[] = JSON.parse(getSpendFromLocal ?? "[]");

const spendSourcesSlice = createSlice({
  name: 'spendSources',
  initialState,
  reducers: {
    addSpendSources: (state, action: PayloadAction<SpendFrom>) => {
      const newState = [...state, action.payload];
      update(newState);
      return newState
    },
    editSpendSources: (state, action: PayloadAction<SpendFrom>) => {
      const id = action.payload.id;
      const newState = state.map(s => s.id === id ? { ...action.payload } : { ...s });
      update(newState);
      return newState;
    },
    deleteSpendSources: (state, action: PayloadAction<number>) => {
      const newState = state.filter(source => source.id !== action.payload);
      update(newState);
      return newState;
    },
    setSpendSources: (state, action: PayloadAction<SpendFrom[]>) => {
      if (state.length !== action.payload.length) return;
      update(action.payload);
      return action.payload
    },
  },
});

export const { addSpendSources, editSpendSources, deleteSpendSources, setSpendSources } = spendSourcesSlice.actions;
export default spendSourcesSlice.reducer;
