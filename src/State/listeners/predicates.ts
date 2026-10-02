import { isAnyOf, type UnknownAction } from "@reduxjs/toolkit";
import {
	docsSelectors,
	metadataSelectors,
	sourcesActions,
} from "../scoped/backups/sources/slice";
import { RootState } from "../store/store";
import { listenerKick } from "./actions";
import { runtimeActions } from "@/State/runtime/slice";
import { sourceBeaconJoin } from "@/State/scoped/beacons/selectors";
import { canonicalRelayUrls } from "@/State/scoped/beacons/relays";

export type ListenerPredicate = (
	action: UnknownAction,
	curr: RootState,
	prev: RootState,
) => boolean;

export const draft = (state: RootState, sourceId: string) =>
	docsSelectors.selectById(state, sourceId)?.draft;

export const meta = (state: RootState, sourceId: string) =>
	metadataSelectors.selectById(state, sourceId);

export const exists = (curr: RootState, sourceId: string) => {
	const d = draft(curr, sourceId);
	return !!d && !d.deleted.value;
};

export const isStale = (state: RootState, sourceId: string) => {
	const d = draft(state, sourceId);
	if (!d || d.deleted.value) return true;

	return sourceBeaconJoin(
		state,
		d.lpk,
		canonicalPresentRelays(state, sourceId),
	).health !== "fresh";
};

export const isFresh = (state: RootState, sourceId: string) =>
	!isStale(state, sourceId);

export const becameFresh = (curr: RootState, prev: RootState, sourceId: string) => {
	return isStale(prev, sourceId) && !isStale(curr, sourceId);
};

export const justAdded = (curr: RootState, prev: RootState, sourceId: string) =>
	!exists(prev, sourceId) && exists(curr, sourceId);

export const justDeleted = (curr: RootState, prev: RootState, sourceId: string) =>
	exists(prev, sourceId) && !exists(curr, sourceId);

export const sourceIdOf = (action: UnknownAction): string =>
	(action.payload as { sourceId: string }).sourceId;

const presentRelayUrls = (relays?: Record<string, { present: boolean }>) =>
	relays ? Object.keys(relays).filter(url => relays[url]?.present) : [];

const canonicalPresentRelays = (state: RootState, sourceId: string) =>
	canonicalRelayUrls(presentRelayUrls(draft(state, sourceId)?.relays));

const sameRelays = (a: string[], b: string[]) =>
	a.length === b.length && a.every((url, i) => url === b[i]);

const isPotentialRelayChangeAction = isAnyOf(
	sourcesActions.setRelayPresence,
	sourcesActions.applyRemoteSource,
);

export const isSourceRelaysChanged: ListenerPredicate = (action, curr, prev) => {
	if (!isPotentialRelayChangeAction(action)) return false;

	const sourceId = sourceIdOf(action);
	return !sameRelays(
		canonicalPresentRelays(curr, sourceId),
		canonicalPresentRelays(prev, sourceId),
	);
};


export const isPotentialSourceUpsertAction = isAnyOf(
	sourcesActions.applyRemoteSource,
	sourcesActions._createDraftDoc,
);


export const isPotentialSourceRemovalAction = isAnyOf(
	sourcesActions.applyRemoteSource,
	sourcesActions.markDeleted,
);

export const sourceJustAdded: ListenerPredicate = (action, curr, prev) =>
	isPotentialSourceUpsertAction(action)
	&& justAdded(curr, prev, action.payload.sourceId);


export const sourceJustDeleted: ListenerPredicate = (action, curr, prev) =>
	isPotentialSourceRemovalAction(action)
	&& justDeleted(curr, prev, sourceIdOf(action));

export const sourceIdsThatBecameFresh = (
	lpk: string,
	curr: RootState,
	prev: RootState,
) =>
	docsSelectors.selectAll(curr)
		.filter(e => !e.draft.deleted.value && e.draft.lpk === lpk)
		.map(e => e.draft.source_id)
		.filter(id => becameFresh(curr, prev, id));


export const listenerKickOrAppBecameActive = (action: UnknownAction): boolean =>
	listenerKick.match(action)
	|| (
		runtimeActions.setAppActiveStatus.match(action)
		&& action.payload.active
	);
