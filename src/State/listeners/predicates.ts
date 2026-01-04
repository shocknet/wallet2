import { SourceType } from "@/State/scoped/common";
import { docsSelectors, metadataSelectors } from "../scoped/backups/sources/slice";
import { RootState } from "../store/store";
import { BEACON_STALE_OLDER_THAN } from "../scoped/backups/sources/state";



const draft = (state: RootState, sourceId: string) =>
	docsSelectors.selectById(state, sourceId)?.draft;

const meta = (state: RootState, sourceId: string) =>
	metadataSelectors.selectById(state, sourceId);

export const isNprofile = (curr: RootState, sourceId: string) => {
	const d = draft(curr, sourceId);
	return !!d && d.type === SourceType.NPROFILE_SOURCE;
};

export const exists = (curr: RootState, sourceId: string) => {
	const d = draft(curr, sourceId);
	return !!d && !d.deleted.value;
};


export const isStale = (state: RootState, sourceId: string, nowMs = Date.now()) => {
	const m = meta(state, sourceId);
	if (!m) return true;
	return nowMs - m.lastSeenAtMs > BEACON_STALE_OLDER_THAN;
};

export const isFresh = (state: RootState, sourceId: string) =>
	!isStale(state, sourceId);


export const becameFresh = (curr: RootState, prev: RootState, sourceId: string) => {
	const nowMs = Date.now();
	return isStale(prev, sourceId, nowMs) && !isStale(curr, sourceId, nowMs);
}



export const justAdded = (curr: RootState, prev: RootState, sourceId: string) =>
	!exists(prev, sourceId) && exists(curr, sourceId);

export const justDeleted = (curr: RootState, prev: RootState, sourceId: string) =>
	exists(prev, sourceId) && !exists(curr, sourceId);
