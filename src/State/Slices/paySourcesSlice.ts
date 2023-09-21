import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';
import { NOSTR_PUB_DESTINATION, options } from '../../constants';

const getPayToLocal = localStorage.getItem("payTo");

const initialState: PayTo[] = JSON.parse(getPayToLocal??"[]").length!==0?
    JSON.parse(getPayToLocal??"[]")
    :
    [
      {
        id: 0,
        label: "Bootstrap Node",
        pasteField: NOSTR_PUB_DESTINATION,
        option: options.little,
        icon: "0",
      }
    ];

const update = (value: PayTo[]) => {
  localStorage.setItem("payTo", JSON.stringify(value));
}

const paySourcesSlice = createSlice({
  name: 'paySources',
  initialState,
  reducers: {
    addPaySources: (state: PayTo[], action: PayloadAction<PayTo>) => {
      state.push(action.payload);
      update(state);
    },
    editPaySources: (state: PayTo[], action: PayloadAction<PayTo>) => {
      const id = action.payload.id;
      state[id] = action.payload;
      update(state);
    },
    deletePaySources: (state, action: PayloadAction<number>) => {
      state.splice(action.payload, 1)
      update(state);
    },
    setPaySources: (state, action: PayloadAction<PayTo[]>) => {
      for (let i = 0; i < state.length; i++) {
        const element = action.payload[i];
        state[i] = element;
      }
      update(state);
    },
  },
});

export const { addPaySources, editPaySources, deletePaySources, setPaySources } = paySourcesSlice.actions;
export default paySourcesSlice.reducer;
