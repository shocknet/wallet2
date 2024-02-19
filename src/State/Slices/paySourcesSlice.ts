import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';
import { mergeArrayValues, mergeBasicRecords} from './dataMerge';
import loadInitialState, { MigrationFunction, getStateAndVersion, applyMigrations } from './migrations';
import { decodeNprofile, encodeNprofile } from '../../custom-nip19';
import { OLD_NOSTR_PUB_DESTINATION } from '../../constants';


type PaySourceRecord = Record<string, PayTo>;

interface PaySourceState {
  sources: PaySourceRecord;
  order: string[];
}


export const storageKey = "payTo"
export const VERSION = 2;
const migrations: Record<number, MigrationFunction<any>> = {
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
  // the array to record sources migration
  2: (data) => {
    console.log("running migration v2 of payToSources")
    const state = data as PayTo[];
    const order: string[] = [];
    const payToRecord = state.reduce((record: PaySourceRecord, source) => {
      if (!source.pasteField.startsWith("nprofile")) {
        record[source.pasteField] = source;
        order.push(source.pasteField)
      } else {
        const decoded = decodeNprofile(source.pasteField);
        record[decoded.pubkey] = source
        order.push(decoded.pubkey);
      }
      return record;
    }, {});
    return {
      sources: payToRecord,
      order
    } as PaySourceState;
  }
};



export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  const local = getStateAndVersion(serialLocal)
  const remote = getStateAndVersion(serialRemote)
  const migratedRemote = applyMigrations(remote.state, remote.version, migrations) as PaySourceState;
  const migratedLocal = applyMigrations(local.state, local.version, migrations) as PaySourceState;
  const merged: PaySourceState = {
    sources: mergeBasicRecords(migratedLocal.sources, migratedRemote.sources),
    order: mergeArrayValues(migratedLocal.order, migratedRemote.order, v => v)
  }
  
  return JSON.stringify({
    version: VERSION,
    data: merged
  });
}





const update = (value: PaySourceState) => {
  const stateToSave = {
    version: VERSION,
    data: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}





const initialState: PaySourceState = loadInitialState(storageKey, JSON.stringify({ sources: {}, order: [] }), migrations, update);



const paySourcesSlice = createSlice({
  name: 'paySources',
  initialState,
  reducers: {
    addPaySources: (state: PaySourceState, action: PayloadAction<{source: PayTo, key: string}>) => {
      state.sources[action.payload.key] = action.payload.source;
      state.order.push(action.payload.key);
      update(state);
      return state;
    },
    editPaySources: (state: PaySourceState, action: PayloadAction<{source: PayTo, key: string}>) => {
      state.sources[action.payload.key] = action.payload.source
      update(state);
      return state;
    },
    deletePaySources: (state, action: PayloadAction<string>) => {
      delete state.sources[action.payload]
      const newOrder = state.order.filter(s => s !== action.payload);
      state.order = newOrder;
      update(state);
      return state;
    },
    setPaySources: (state, action: PayloadAction<string[]>) => {
      if (state.order.length !== action.payload.length) return;
      state.order = action.payload
      update(state);
      return state;
    },
  },
});

export const { addPaySources, editPaySources, deletePaySources, setPaySources } = paySourcesSlice.actions;
export default paySourcesSlice.reducer;
