import { createAction, TaskResult } from "@reduxjs/toolkit";
import { Identity } from "../types";
import { Deferred } from "@/lib/deferred";


export const identityLoaded = createAction<{ identity: Identity }>("identity/loaded");
export const identityUnloaded = createAction("identity/unloaded");

export const publisherFlushRequested = createAction("publisher/flush");

export const checkDirtyRequested = createAction("publisher/checkDirty");
/* export const listenerKick = createAction("@@listeners/kick"); */

export const historyFetchAllRequested = createAction<{ deferred: Deferred<void> }>("history/fetchAll");
export const historyFetchSourceRequested = createAction<{ sourceId: string; deferred: Deferred<TaskResult<void>> }>("history/fetchOne");


