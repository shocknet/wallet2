import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';
import { mergeArrayValues } from './dataMerge';
import loadInitialState, { MigrationFunction, getStateAndVersion, applyMigrations } from './migrations';
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
      } else if (decodeNprofile(source.pasteField).bridge?.length) {
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



export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  const local = getStateAndVersion(serialLocal)
  const remote = getStateAndVersion(serialRemote)
  const migratedRemote = applyMigrations(remote.state, remote.version, migrations);
  
  const merged: PayTo[] = mergeArrayValues(local.state as PayTo[], migratedRemote, v => v.pasteField)
  return JSON.stringify(merged)
}








const update = (value: PayTo[]) => {
  const stateToSave = {
    version: VERSION,
    paySources: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}





const initialState: PayTo[] = loadInitialState(storageKey, "[]", migrations, update);



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
