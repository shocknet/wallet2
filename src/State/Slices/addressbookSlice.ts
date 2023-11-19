import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type AddressBook = {
  contacts: Record<string, string>
  addressToContact: Record<string, string>
  identifierToAddress: Record<string, string>
  identifierToContact: Record<string, string>
}
type AddressBookLink = { identifier?: string, address?: string, contact?: string }
const addressbook = localStorage.getItem("addressbook");

const update = (value: AddressBook) => {
  localStorage.setItem("addressbook", JSON.stringify(value));
}
const iState: AddressBook = { contacts: {}, addressToContact: {}, identifierToAddress: {}, identifierToContact: {} }
const initialState: AddressBook = JSON.parse(addressbook ?? JSON.stringify(iState));

const addressbookSlice = createSlice({
  name: 'addressbook',
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
  },
});

export const { addAddressbookLink } = addressbookSlice.actions;
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