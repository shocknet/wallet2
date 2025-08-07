import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { syncRedux } from '../thunks/syncRedux';
export const storageKey = "invitations"

interface InvitationEntry {
  inviteToken: string,
  amount: number | null,
  creationTimestamp: number;
  used: boolean;
}

interface InvitationsState {
  invitations: InvitationEntry[]
}
export const mergeLogic = (serialLocal: string): string => {
  return serialLocal
}

const state = localStorage.getItem(storageKey);

const update = (value: InvitationsState) => {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

const initialState: InvitationsState = JSON.parse(state ?? JSON.stringify({ invitations: [] }));

const oneTimeInviteLinkSlice = createSlice({
  name: storageKey,
  initialState,
  reducers: {
    addInvitation: (state, action: PayloadAction<InvitationEntry>) => {
      state.invitations.push(action.payload);
      update(state)
    },
    setInvitationToUsed: (state, action: PayloadAction<string>) => {
      const index = state.invitations.findIndex(i => i.inviteToken === action.payload);
      if (index !== -1) {
        state.invitations[index] = { ...state.invitations[index], used: true }
        update(state)
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return JSON.parse(localStorage.getItem(storageKey) ?? JSON.stringify({ checkTime: 0, notifications: [] }));
    })
  }
});

export const { addInvitation, setInvitationToUsed } = oneTimeInviteLinkSlice.actions;
export default oneTimeInviteLinkSlice.reducer;
