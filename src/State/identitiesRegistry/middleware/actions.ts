import { createAction } from "@reduxjs/toolkit";
import { Identity } from "../types";


export const identityLoaded = createAction<{ identity: Identity }>("identity/loaded");
export const identityUnloaded = createAction("identity/unloaded");

export const publisherFlushRequested = createAction("publisher/flush");

export const checkDirtyRequested = createAction("publisher/checkDirty");
