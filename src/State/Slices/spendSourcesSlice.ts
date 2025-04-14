import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { SourceTrustLevel, SpendFrom } from '../../globalTypes';
import { getDiffAsActionDispatch, mergeArrayValues } from './dataMerge';
import loadInitialState, { MigrationFunction, applyMigrations, getStateAndVersion } from './migrations';
import { syncRedux } from '../store';
import { getNostrPrivateKey } from '../../Api/nostr';
import { getPublicKey } from 'nostr-tools';
import { BackupAction } from '../types';
import { decodeNprofile } from '../../constants';
import { Buffer } from 'buffer';


export const storageKey = "spendFrom"
export const VERSION = 4;

export type SpendSourceRecord = Record<string, SpendFrom>;

export interface SpendSourceState {
  sources: SpendSourceRecord;
  order: string[];
}

export const migrations: Record<number, MigrationFunction<any>> = {
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
  },
  // key pair per source migration
  2: (state) => {
    console.log("running migration v2 of SpendFromSources")
    const privateKey = getNostrPrivateKey()
    if (!privateKey) return state;
    if (state.sources) {
      for (const key in state.sources) {
        if (state.sources[key].pubSource && !state.sources[key].keys) {
          state.sources[key].keys = {
            privateKey,
            publicKey: getPublicKey(Buffer.from(privateKey, 'hex'))
          }
        }
      }
    }
    return state
  },
  // the order array is now a string of lpk + source npub
  3: (state: SpendSourceState) => {
    console.log("running migration v3 of SpendFromSources")

    const order = state.order;
    const sourcesObject = state.sources;

    const newOrderArray = order.map(lpk => {
      if (!sourcesObject[lpk].pubSource) {
        return lpk;
      }
      const source = sourcesObject[lpk]
      const publicKey = source.keys.publicKey;
      return `${lpk}-${publicKey}`;
    });

    const newSourcesObject: SpendSourceRecord = {};
    for (const key in sourcesObject) {
      // eslint-disable-next-line
      if (sourcesObject.hasOwnProperty(key)) {
        if (!sourcesObject[key].pubSource) {
          newSourcesObject[key] = sourcesObject[key];
        } else {
          const publicKey = sourcesObject[key].keys.publicKey;
          const newKey = `${key}-${publicKey}`;
          newSourcesObject[newKey] = sourcesObject[key];
          newSourcesObject[newKey].id = newKey
        }
      }
    }
    state.order = newOrderArray;
    state.sources = newSourcesObject;
    return state

  },
  4: (state) => {
    state.order.forEach((id: any) => {
      const source = state.sources[id];
      if (!source.option) {
        state.sources[id] = { ...source, option: SourceTrustLevel.MEDIUM }
      } else if (source.option === "A little.") {
        state.sources[id] = { ...source, option: SourceTrustLevel.LOW }
      } else if (source.option === "Very well.") {
        state.sources[id] = { ...source, option: SourceTrustLevel.MEDIUM }
      } else {
        state.sources[id] = { ...source, option: SourceTrustLevel.HIGH }
      }

    })
    return state;
  }
};

export const mergeLogic = (serialLocal: string, serialRemote: string): { data: string, actions: BackupAction[] } => {
  const local = getStateAndVersion(serialLocal)
  const remote = getStateAndVersion(serialRemote)
  const migratedRemote = applyMigrations(remote.state, remote.version, migrations) as SpendSourceState;
  const migratedLocal = applyMigrations(local.state, local.version, migrations) as SpendSourceState;
  const actions: BackupAction[] = []

  const merged: SpendSourceState = {
    sources: getDiffAsActionDispatch(migratedRemote.sources, migratedLocal.sources, "spendSources/addSpendSources", actions),
    order: mergeArrayValues(migratedRemote.order, migratedLocal.order, s => s)
  };

  return {
    data: JSON.stringify({
      version: VERSION,
      data: merged
    }),
    actions
  }
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
    addSpendSources: (state, action: PayloadAction<{ source: SpendFrom, first?: boolean }>) => {
      if (state.sources[action.payload.source.id]) return;

      state.sources[action.payload.source.id] = action.payload.source;
      if (action.payload.first) {
        state.order.unshift(action.payload.source.id);
      } else {
        state.order.push(action.payload.source.id);
      }
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
    fixSpendDuplicates: (state) => {
      state.order = state.order.reduce((acc, id) => {
        if (!acc.includes(id)) {
          acc.push(id);
        }
        return acc
      }, [] as string[]);
      update(state);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return loadInitialState(storageKey, JSON.stringify({ sources: {}, order: [] }), migrations, update);
    })
  }
});

export const { addSpendSources, editSpendSources, deleteSpendSources, setSpendSources, fixSpendDuplicates } = spendSourcesSlice.actions;
export default spendSourcesSlice.reducer;



export const selectSpendSourceSourceById = createSelector(
  [
    (spendFrom: SpendSourceState) => spendFrom.sources,
    (_spendFrom: SpendSourceState, id: string) => id
  ],
  (sources, id) => {
    console.log("selecting source by id", id)
    return sources[id]
  }
);


