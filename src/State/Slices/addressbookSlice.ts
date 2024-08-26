import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { getDiffAsActionDispatch, } from './dataMerge';
import { syncRedux } from '../store';
import { BackupAction } from '../types';
export const storageKey = "addressbook"
type AddressBook = {
  contacts: Record<string, string>
  addressToContact: Record<string, string>
  identifierToAddress: Record<string, string>
  identifierToContact: Record<string, string>
  identifierToMemo?: Record<string, string>
}
export const mergeLogic = (serialLocal: string, serialRemote: string): { data: string, actions: BackupAction[] } => {
  const local = JSON.parse(serialLocal) as AddressBook
  const remote = JSON.parse(serialRemote) as AddressBook

  const actions: BackupAction[] = [];
  const merged: AddressBook = {
    contacts: remote.contacts,
    addressToContact: getDiffAsActionDispatch(remote.addressToContact, local.addressToContact, "addressbook/addAddressToContact", actions),
    identifierToAddress: getDiffAsActionDispatch(remote.identifierToAddress, local.identifierToAddress, "addressbook/addIdentifierToAddress", actions),
    identifierToContact: getDiffAsActionDispatch(remote.identifierToContact, local.identifierToContact, "addressbook/addIdentifierToContact", actions),
    identifierToMemo: getDiffAsActionDispatch(remote.identifierToMemo || {}, local.identifierToMemo || {}, "addressbook/addIdentifierMemo", actions),
  }
  return {
    data: JSON.stringify(merged),
    actions
  }
}


const addressbook = localStorage.getItem(storageKey);

const update = (value: AddressBook) => {
  localStorage.setItem(storageKey, JSON.stringify(value));
}
const iState: AddressBook = { contacts: {}, addressToContact: {}, identifierToAddress: {}, identifierToContact: {}, identifierToMemo: {} }
const initialState: AddressBook = JSON.parse(addressbook ?? JSON.stringify(iState));

const addressbookSlice = createSlice({
  name: storageKey,
  initialState,
  reducers: {
    addAddressToContact: (state, action: PayloadAction<{ address: string, contact: string }>) => {
      state.addressToContact[action.payload.address] = action.payload.contact;
      update(state);
    },
    addIdentifierToContact: (state, action: PayloadAction<{ identifier: string, contact: string }>) => {
      state.identifierToContact[action.payload.identifier] = action.payload.contact;
      update(state);
    },
    addIdentifierToAddress: (state, action: PayloadAction<{ address: string, identifier: string }>) => {
      state.identifierToAddress[action.payload.identifier] = action.payload.address;
      update(state);
    },
    addAddressbookLink: (state, action: PayloadAction<{ address: string, contact: string, identifier: string }>) => {
      state.identifierToAddress[action.payload.identifier] = action.payload.address;
      state.addressToContact[action.payload.address] = action.payload.contact
      update(state);
    },
    addIdentifierMemo: (state, action: PayloadAction<{ identifier: string, memo: string }>) => {
      const { identifier, memo } = action.payload
      if (!state.identifierToMemo) {
        state.identifierToMemo = { [identifier]: memo }
      } else {
        state.identifierToMemo[identifier] = memo
      }
      update(state)
    }
  },
  extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return JSON.parse(localStorage.getItem(storageKey) ?? JSON.stringify(iState));
    })
  }
});

export const { addAddressbookLink, addIdentifierMemo, addAddressToContact, addIdentifierToAddress, addIdentifierToContact } = addressbookSlice.actions;
export default addressbookSlice.reducer;

export const getIdentifierLink = (state: AddressBook, identifier: string) => {
  const contactFromId = state.identifierToContact[identifier]
  if (contactFromId) {
    return contactFromId
  }
  const address = state.identifierToAddress[identifier]
  if (!address) {
    return identifier
  }
  const contactFromAddress = state.addressToContact[address]
  if (contactFromAddress) {
    return contactFromAddress
  }
  return address
}