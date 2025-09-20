import { createAction } from "@reduxjs/toolkit";
import { Identity } from "../types";

export const identitySwitchRequested = createAction<{ pubkey: string }>("identity/switchRequested"); // payload: pubkey
export const identitySwitchAborted = createAction<{ pubkey: string; reason: string }>("identity/switchAborted");

export const identityLoaded = createAction<{ identity: Identity }>("identity/loaded");
export const identityUnloaded = createAction("identity/unloaded");

export const publisherFlushRequested = createAction("publisher/flush");
