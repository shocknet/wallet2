import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { NotifyItemData } from '../../globalTypes';
export const storageKey = "notifications"

interface NotificationType {
  checkTime: number,
  notifications: NotifyItemData[],
}
export const mergeLogic = (serialLocal: string): string => {
  return serialLocal
}

const notifications = localStorage.getItem(storageKey);

const update = (value: NotificationType) => {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

const initialState: NotificationType = JSON.parse(notifications ?? JSON.stringify({ checkTime: 0, notifications: [] }));

const notifySlice = createSlice({
  name: storageKey,
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotifyItemData>) => {
      state.notifications.push(action.payload);
      update(state)
    },
    updateCheckTime: (state, action: PayloadAction<number>) => {
      state.checkTime = action.payload;
      update(state)
    },
    removeNotify: (state, action: PayloadAction<number>) => {
      console.log(JSON.stringify(state.notifications), action.payload);
      const newArray = state.notifications.filter(item => item.date !== action.payload);
      console.log(newArray);
      state.notifications = newArray;
      update(state)
    }
  },
});

export const { addNotification, updateCheckTime, removeNotify } = notifySlice.actions;
export default notifySlice.reducer;
