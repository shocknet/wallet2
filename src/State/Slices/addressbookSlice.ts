import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { mergeBasicRecords } from './dataMerge';
export const storageKey = "addressbook"
type AddressBook = {
  contacts: Record<string, string>
  addressToContact: Record<string, string>
  identifierToAddress: Record<string, string>
  identifierToContact: Record<string, string>
  identifierToMemo?: Record<string, string>
}
export const mergeLogic = (serialLocal: string, serialRemote: string): string => {
  const local = JSON.parse(serialLocal) as AddressBook
  const remote = JSON.parse(serialRemote) as AddressBook
  const merged: AddressBook = {
    contacts: mergeBasicRecords(local.contacts, remote.contacts),
    addressToContact: mergeBasicRecords(local.addressToContact, remote.addressToContact),
    identifierToAddress: mergeBasicRecords(local.identifierToAddress, remote.identifierToAddress),
    identifierToContact: mergeBasicRecords(local.identifierToContact, remote.identifierToContact),
    identifierToMemo: mergeBasicRecords(local.identifierToMemo || {}, remote.identifierToMemo || {}),
  }
  return JSON.stringify(merged)
}

type AddressBookLink = { identifier?: string, address?: string, contact?: string }
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
    addAddressbookLink: (state, action: PayloadAction<AddressBookLink>) => {
      const { identifier, contact, address } = action.payload
      if (!identifier && !!address && !!contact) { // 0-1-1
        state.addressToContact[address] = contact
      } else if (!!identifier && !address && !!contact) { // 1-0-1
        state.identifierToContact[identifier] = contact
      } else if (!!identifier && !!address && !contact) { // 1-1-0
        state.identifierToAddress[identifier] = address
      } else if (!!identifier && address && !!contact) {// 1-1-1
        state.identifierToAddress[identifier] = address
        state.addressToContact[address] = contact
      } else {
        console.log("nothing to link")
      }
      if (!!contact && !state.contacts[contact]) {
        state.contacts[contact] = ""
      }
      update(state)
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
});

export const { addAddressbookLink, addIdentifierMemo } = addressbookSlice.actions;
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