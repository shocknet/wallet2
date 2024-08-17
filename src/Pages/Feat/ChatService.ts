import { ChatStorage } from "./ChatStorage";

export const ChatService = (response: string) => {
  return response == "a"
    ? ChatStorage.A
    : response == "b"
    ? ChatStorage.B
    : response == "c"
    ? ChatStorage.C
    : response == "d"
    ? ChatStorage.D
    : { purpose: "default", message: "Sorry, I don't know this message" };
};
