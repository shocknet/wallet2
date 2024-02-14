import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';
import { mergeArrayValues } from './dataMerge';
import applyMigrations, { PAYTO_VERSION, PayToMigrations } from './migrations';





export const storageKey = "payTo"
export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  const local = JSON.parse(serialLocal) as PayTo[]
  const remote = JSON.parse(serialRemote) as PayTo[]
  const merged: PayTo[] = mergeArrayValues(local, remote, v => v.pasteField)
  return JSON.stringify(merged)
}


const update = (value: PayTo[]) => {
  const stateToSave = {
    version: PAYTO_VERSION,
    paySources: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}


const loadInitialState = () => {
  const storedData = localStorage.getItem(storageKey);
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    let migrationResult: any = null;
    if (parsedData.version === undefined) {
      migrationResult = applyMigrations(parsedData, 0, PayToMigrations)
    } else {
      migrationResult = applyMigrations(parsedData.paySources, parsedData.version, PayToMigrations)
    }
    update(migrationResult)
    return migrationResult || [];
  }
  return [];
};


const initialState: PayTo[] = loadInitialState();



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
