import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';
import { mergeArrayValues } from './dataMerge';
import applyMigrations, { MigrationFunction } from './migrations';
import { decodeNprofile, encodeNprofile } from '../../custom-nip19';
import { OLD_NOSTR_PUB_DESTINATION } from '../../constants';





export const storageKey = "payTo"
export const VERSION = 1;
export const migrations: Record<number, MigrationFunction<PayTo[]>> = {
  // the bridge url encoded in nprofile migration
  1: (data) => {
		console.log("running migration v1 of payToSources");
    const state = data as PayTo[];
    const newState = state.map(source => {
      if (!source.pasteField.startsWith("nprofile") || source.label !== "Bootstrap Node") {
        return source
      } else if (decodeNprofile(source.pasteField).bridge) {
        return source;
      } else {
        const decoded = decodeNprofile(source.pasteField);
        const newNprofile = encodeNprofile({
          pubkey: decoded.pubkey,
          relays: decoded.relays,
          bridge: decoded.pubkey === OLD_NOSTR_PUB_DESTINATION ? ["https://zap.page"] : ["https://shockwallet.app"]
        })
        return {
          ...source,
          pasteField: newNprofile
        }
      }

    })
    return newState;
  },

};

const handleVersioning = (parsedData: any) =>{
  let migrationResult: any = null;
  if (parsedData.version === undefined) {
    migrationResult = applyMigrations(parsedData, 0, migrations)
  } else {
    migrationResult = applyMigrations(parsedData.paySources, parsedData.version, migrations)
  }
  return migrationResult;
}

export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  const local = JSON.parse(serialLocal) as PayTo[]
  const remote = JSON.parse(serialRemote)
  const migratedRemote = handleVersioning(remote) as PayTo[]
  const merged: PayTo[] = mergeArrayValues(local, migratedRemote, v => v.pasteField)
  return JSON.stringify(merged)
}







const update = (value: PayTo[]) => {
  const stateToSave = {
    version: VERSION,
    paySources: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}


const loadInitialState = () => {
  const storedData = localStorage.getItem(storageKey);
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    const migrationResult = handleVersioning(parsedData)
    update(migrationResult)
    return migrationResult;
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
