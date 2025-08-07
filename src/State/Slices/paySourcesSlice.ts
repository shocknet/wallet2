import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo, SourceTrustLevel } from '../../globalTypes';
import { getDiffAsActionDispatch, mergeArrayValues } from './dataMerge';
import loadInitialState, { MigrationFunction, getStateAndVersion, applyMigrations } from './migrations';
import { decodeNprofile } from '../../constants';
import { getNostrPrivateKey, parseNprofile } from '@/lib/nprofile';
import { getPublicKey } from 'nostr-tools';
import { BackupAction } from '../types';
import { nip19 } from 'nostr-tools'
import { Buffer } from 'buffer';
import { saveMultipleKeys } from '../indexedDB';
import { syncRedux } from '../thunks/syncRedux';

const { nprofileEncode: encodeNprofile } = nip19

export type PaySourceRecord = Record<string, PayTo>;

export interface PaySourceState {
  sources: PaySourceRecord;
  order: string[];
}


export const storageKey = "payTo"
export const VERSION = 5;
export const migrations: Record<number, MigrationFunction<any>> = {
  // the bridge url encoded in nprofile migration
  1: (data) => {
    console.log("running migration v1 of payToSources");
    const state = data as PayTo[];
    const newState = state.map(source => {
      if (!source.pasteField.startsWith("nprofile") || source.label !== "Bootstrap Node") {
        return source
      } /* else if (decodeNprofile(source.pasteField).bridge?.length) {
        return source;
      } */ else {
        const decoded = decodeNprofile(source.pasteField);
        const newNprofile = encodeNprofile({
          pubkey: decoded.pubkey,
          relays: decoded.relays,
          //bridge: decoded.pubkey === OLD_NOSTR_PUB_DESTINATION ? ["https://zap.page"] : ["https://shockwallet.app"]
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
        record[source.pasteField] = { ...source, id: source.pasteField };
        order.push(source.pasteField)
      } else {
        const decoded = decodeNprofile(source.pasteField);
        record[decoded.pubkey] = { ...source, pubSource: true, id: decoded.pubkey };
        order.push(decoded.pubkey);
      }
      return record;
    }, {});
    return {
      sources: payToRecord,
      order
    } as PaySourceState;
  },
  // key pair per source migration
  3: (state) => {
    console.log("running migration v3 of payToSources")
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
  4: (state: PaySourceState) => {
    console.log("running migration v4 of SpendFromSources")

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

    const newSourcesObject: PaySourceRecord = {};
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
  5: (state) => {
    // option field more strict
    console.log({ state })
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
    return state
  }
};



export const mergeLogic = (serialLocal: string, serialRemote: string): { data: string, actions: BackupAction[] } => {
  const local = getStateAndVersion(serialLocal)
  const remote = getStateAndVersion(serialRemote)
  const migratedRemote = applyMigrations(remote.state, remote.version, migrations) as PaySourceState;
  const migratedLocal = applyMigrations(local.state, local.version, migrations) as PaySourceState;


  const actions: BackupAction[] = [];
  const merged: PaySourceState = {
    sources: getDiffAsActionDispatch(migratedRemote.sources, migratedLocal.sources, "paySources/addPaySources", actions),
    order: mergeArrayValues(migratedRemote.order, migratedLocal.order, s => s)
  }


  return {
    data: JSON.stringify({
      version: VERSION,
      data: merged
    }),
    actions
  }

}





const update = (value: PaySourceState) => {
  const stateToSave = {
    version: VERSION,
    data: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}





const initialState: PaySourceState = loadInitialState(storageKey, JSON.stringify({ sources: {}, order: [] }), migrations, update);
const HAS_SENT_KEYS_TO_NOTIFICATIONS = 'has_sent_keys_to_notifications'
if (!localStorage.getItem(HAS_SENT_KEYS_TO_NOTIFICATIONS)) {
  localStorage.setItem(HAS_SENT_KEYS_TO_NOTIFICATIONS, 'true')
  const req = Object.values(initialState.sources).filter(s => s.keys && s.pubSource).map(s => ({ keys: s.keys, appNpub: parseNprofile(s.pasteField).pubkey }))
  saveMultipleKeys(req)
}



const paySourcesSlice = createSlice({
  name: 'paySources',
  initialState,
  reducers: {
    addPaySources: (state: PaySourceState, action: PayloadAction<{ source: PayTo, first?: boolean }>) => {
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
    editPaySources: (state: PaySourceState, action: PayloadAction<PayTo>) => {
      state.sources[action.payload.id] = action.payload
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
    fixPayDuplicates: (state) => {
      state.order = state.order.reduce((acc, id) => {
        if (!acc.includes(id)) {
          acc.push(id);
        }
        return acc
      }, [] as string[]);
      update(state);
    },
    flipSourceNdebitDiscoverable: (state, action: PayloadAction<PayTo>) => {
      state.sources[action.payload.id] = action.payload
      update(state)
      return state;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return loadInitialState(storageKey, JSON.stringify({ sources: {}, order: [] }), migrations, update);
    })
  }
});

export const { addPaySources, editPaySources, deletePaySources, setPaySources, fixPayDuplicates, flipSourceNdebitDiscoverable } = paySourcesSlice.actions;
export default paySourcesSlice.reducer;
