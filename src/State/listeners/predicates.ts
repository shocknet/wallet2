import { isAnyOf, type UnknownAction } from "@reduxjs/toolkit";

import { SourceType } from "@/State/scoped/backups/sources/schema";
import {
	docsSelectors,
	metadataSelectors,
	sourcesActions,
} from "../scoped/backups/sources/slice";
import { RootState } from "../store/store";
import { listenerKick } from "./actions";
import { runtimeActions } from "@/State/runtime/slice";
import { computeBeaconHealth, selectBeaconProbeById } from "../scoped/backups/sources/selectors";

export type ListenerPredicate = (
	action: UnknownAction,
	curr: RootState,
	prev: RootState,
) => boolean;

export const draft = (state: RootState, sourceId: string) =>
	docsSelectors.selectById(state, sourceId)?.draft;

export const beaconProbe = (state: RootState, sourceId: string) =>
	selectBeaconProbeById(state, sourceId);

export const meta = (state: RootState, sourceId: string) =>
	metadataSelectors.selectById(state, sourceId);

export const isNprofile = (curr: RootState, sourceId: string) => {
	const d = draft(curr, sourceId);
	return !!d && d.type === SourceType.NPROFILE_SOURCE;
};

export const exists = (curr: RootState, sourceId: string) => {
	const d = draft(curr, sourceId);
	return !!d && !d.deleted.value;
};

export const isStale = (state: RootState, sourceId: string) => {
	const nowMs = state.runtime.nowMs;

	const m = meta(state, sourceId);
	const p = beaconProbe(state, sourceId);
	if (!m) return true;
	return computeBeaconHealth({
		nowMs,
		lastSeenAtMs: m.lastSeenAtMs,
		probe: p,
	}) !== "fresh";
};

export const isFresh = (state: RootState, sourceId: string) =>
	!isStale(state, sourceId);

export const becameFresh = (curr: RootState, prev: RootState, sourceId: string) => {
	return isStale(prev, sourceId) && !isStale(curr, sourceId);
};

export const becameStale = (curr: RootState, prev: RootState, sourceId: string) => {
	return !isStale(prev, sourceId) && isStale(curr, sourceId);
};

export const justAdded = (curr: RootState, prev: RootState, sourceId: string) =>
	!exists(prev, sourceId) && exists(curr, sourceId);

export const justDeleted = (curr: RootState, prev: RootState, sourceId: string) =>
	exists(prev, sourceId) && !exists(curr, sourceId);

export const sourceIdOf = (action: UnknownAction): string =>
	(action.payload as { sourceId: string }).sourceId;


export const isPotentialSourceUpsertAction = isAnyOf(
	sourcesActions.applyRemoteSource,
	sourcesActions._createDraftDoc,
);


export const isPotentialSourceRemovalAction = isAnyOf(
	sourcesActions.applyRemoteSource,
	sourcesActions.markDeleted,
);

export const nprofileJustAdded: ListenerPredicate = (action, curr, prev) =>
	isPotentialSourceUpsertAction(action)
	&& isNprofile(curr, sourceIdOf(action))
	&& justAdded(curr, prev, action.payload.sourceId);




export const nprofileJustDeleted: ListenerPredicate = (action, curr, prev) =>
	isPotentialSourceRemovalAction(action)
	&& isNprofile(curr, sourceIdOf(action))
	&& justDeleted(curr, prev, action.payload.sourceId);


export const sourceJustDeleted: ListenerPredicate = (action, curr, prev) =>
	isPotentialSourceRemovalAction(action)
	&& justDeleted(curr, prev, sourceIdOf(action));


export const nprofileBecameFresh: ListenerPredicate = (action, curr, prev) =>
	sourcesActions.recordBeaconForSource.match(action)
	&& exists(curr, action.payload.sourceId)
	&& becameFresh(curr, prev, action.payload.sourceId);

export const nprofileBecameStale: ListenerPredicate = (action, curr, prev) =>
	sourcesActions.recordBeaconForSource.match(action)
	&& exists(curr, action.payload.sourceId)
	&& becameStale(curr, prev, action.payload.sourceId);






export const listenerKickOrAppBecameActive = (action: UnknownAction): boolean =>
	listenerKick.match(action)
	|| (
		runtimeActions.setAppActiveStatus.match(action)
		&& action.payload.active
	);
