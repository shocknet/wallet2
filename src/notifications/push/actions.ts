import { createAction } from "@reduxjs/toolkit";

export const pushTokenUpdated = createAction<{ token: string }>("push/tokenUpdated");
