import { PayloadAction, createSlice } from "@reduxjs/toolkit";
export const stroageKey = "chats";

interface MessageType {
  purpose?: string;
  message?: string;
  options?: string[];
  sender?: string;
}

interface MessageSourceState {
  checkTime : number,
  chats : MessageType[],
}

const messages = localStorage.getItem(stroageKey);

const update = (value : MessageSourceState) => {
  localStorage.setItem(stroageKey, JSON.stringify(value));
}

const initialState: MessageSourceState = JSON.parse(
  messages ??
    JSON.stringify({
      checkTime: Date.now(),
      chats: [
        {
          purpose: "introduction",
          message:
            "Hey there, I'm Alice! I'm your wallet assistant and an expert with Bitcoin's Lightning Network... I can set-up a cloud node, open a channel, make a payment, pretty much anything you like... Just ask! So, how can I help you today?",
          sender: "bot",
          options: ["Send Payment", "Create a Cloud Node", "Is this private"],
        },
      ],
    })
);

const messageSourceSlice = createSlice({
  name : stroageKey,
  initialState,
  reducers : {
    addChat : (state, action : PayloadAction<MessageType>)=>{
      state.chats.push(action.payload);
      update(state);
    },
    allRemoveChat : (state, action : PayloadAction<MessageType>) => {
      state.chats = [action.payload];
      update(initialState);
    }
  }
})

export const { addChat, allRemoveChat } = messageSourceSlice.actions;
export default messageSourceSlice.reducer;
