import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import loadInitialState, { MigrationFunction } from './migrations';
import { syncRedux } from '../store';

export interface BackupState {
  subbedToBackUp: boolean;
	usingSanctum: boolean;
	usingExtension: boolean;
}

export const storageKey = "backupState"
const VERSION = 1;

const update = (value: BackupState) => {
  const stateToSave = {
    version: VERSION,
    data: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}

export const migrations: Record<number, MigrationFunction<BackupState>> = {
/* no migrations yet */
};


const initialState: BackupState = loadInitialState(
  storageKey,
  JSON.stringify({ subbedToBackUp: false, usingSanctum: false, usingExtension: false }),
  migrations,
  update
);

const backupStateSlice = createSlice({
  name: storageKey,
  initialState,
  reducers: {
    updateBackupData: (state, action: PayloadAction<BackupState>) => {
      state.subbedToBackUp = action.payload.subbedToBackUp;
      state.usingSanctum = action.payload.usingSanctum;
			state.usingExtension = action.payload.usingExtension;
			update(state)
    },
  },
	extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return loadInitialState(
				storageKey,
				JSON.stringify({ subbedToBackUp: false, usingSanctum: false, usingExtension: false }),
				migrations,
				update
			);
    })
  }
});

export const { updateBackupData } = backupStateSlice.actions;
export default backupStateSlice.reducer;
