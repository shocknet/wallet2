import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { NotifyItemData } from '../../globalTypes';

const notifications = localStorage.getItem("notifications");

const update = (value: NotifyItemData[]) => {
  localStorage.setItem("notifications", JSON.stringify(value));
}

const initialState: NotifyItemData[] = JSON.parse(notifications??'[]');

const notifySlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotifyItemData>) => {
      console.log(action.payload);
      
      state.push(action.payload);
      update(state)
    },
  },
});

export const { addNotification } = notifySlice.actions;
export default notifySlice.reducer;
