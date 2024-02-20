import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { SpendFrom } from '../../globalTypes';
import { mergeArrayValuesWithOrder, mergeBasicRecords } from './dataMerge';
import loadInitialState, { MigrationFunction, applyMigrations, getStateAndVersion } from './migrations';
import { decodeNprofile } from '../../custom-nip19';
export const storageKey = "spendFrom"
const VERSION = 1;

type SpendSourceRecord = Record<string, SpendFrom>;

interface SpendSourceState {
  sources: SpendSourceRecord;
  order: string[];
}

const migrations: Record<number, MigrationFunction<any>> = {
  // the array to record sources migration
  1: (data) => {
    console.log("running migration v1 of SpendFromSources")
    const state = data as SpendFrom[];
    const order: string[] = [];
    const payToRecord = state.reduce((record: SpendSourceRecord, source) => {
      if (!source.pasteField.startsWith("nprofile")) {
        record[source.pasteField] = { ...source, id: source.pasteField };
        order.push(source.pasteField)
      } else {
        const decoded = decodeNprofile(source.pasteField);
        record[decoded.pubkey] = { ...source, pubSource: true, id: decoded.pubkey }
        order.push(decoded.pubkey);
      }
      return record;
    }, {});
    return {
      sources: payToRecord,
      order
    } as SpendSourceState;
  }
};

export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  const local = getStateAndVersion(serialLocal)
  const remote = getStateAndVersion(serialRemote)
  const migratedRemote = applyMigrations(remote.state, remote.version, migrations) as SpendSourceState;
  const migratedLocal = applyMigrations(local.state, local.version, migrations) as SpendSourceState;
  const merged: SpendSourceState = {
    sources: mergeBasicRecords(migratedLocal.sources, migratedRemote.sources),
    order: mergeArrayValuesWithOrder(migratedLocal.order, migratedRemote.order, v => v)
  }
  return JSON.stringify(merged)
}

const update = (value: SpendSourceState) => {
  const stateToSave = {
    version: VERSION,
    data: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}

const initialState: SpendSourceState = loadInitialState(storageKey, JSON.stringify({ sources: {}, order: [] }), migrations, update);

const spendSourcesSlice = createSlice({
  name: 'spendSources',
  initialState,
  reducers: {
    addSpendSources: (state, action: PayloadAction<SpendFrom>) => {
      state.sources[action.payload.id] = action.payload;
      state.order.push(action.payload.id);
      update(state);
      return state;
    },
    editSpendSources: (state, action: PayloadAction<SpendFrom>) => {
      state.sources[action.payload.id] = action.payload
      update(state);
      return state;
    },
    deleteSpendSources: (state, action: PayloadAction<string>) => {
      delete state.sources[action.payload]
      const newOrder = state.order.filter(s => s !== action.payload);
      state.order = newOrder;
      update(state);
      return state;
    },
    setSpendSources: (state, action: PayloadAction<string[]>) => {
      if (state.order.length !== action.payload.length) return;
      state.order = action.payload
      update(state);
      return state;
    },
  },
});

export const { addSpendSources, editSpendSources, deleteSpendSources, setSpendSources } = spendSourcesSlice.actions;
export default spendSourcesSlice.reducer;
