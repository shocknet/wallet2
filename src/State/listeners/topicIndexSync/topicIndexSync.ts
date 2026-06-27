import { isAnyOf } from "@reduxjs/toolkit";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";
import type { ListenerSpec } from "../lifecycle/lifecycle";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { isNprofile, justDeleted, meta } from "../predicates";



export const topicIndexSyncSpec: ListenerSpec = {
	name: "topic-index-sync",
	listeners: [
		// When a source's topic id is set from getUserInfo response, index it
		(add) => add({
			actionCreator: sourcesActions.setTopicId,
			effect: async (action, api) => {

				const { sourceId, topicId } = action.payload;

				const state = api.getState();
				const activeIdentityId = selectActiveIdentity(state)!.pubkey;


				api.dispatch(identitiesRegistryActions.setTopicIdIndex({
					identityId: activeIdentityId ?? "",
					sourceId,
					topicId,
				}));
			}
		}),
		// When a source is marked deleted or incoming remote backup deletes, remove its topic id from the index
		(add) => add({
			predicate: (action, curr, prev) =>
			(
				isAnyOf(sourcesActions.applyRemoteSource, sourcesActions.markDeleted)(action) &&
				isNprofile(curr, action.payload.sourceId) &&
				justDeleted(curr, prev, action.payload.sourceId)
			),
			effect: async (action, api) => {
				const { sourceId } = action.payload as { sourceId: string };
				const topicId = meta(api.getOriginalState(), sourceId)?.topicId;
				if (!topicId) return;

				api.dispatch(identitiesRegistryActions.removeTopicIdFromIndex({ topicId }));
			}
		})
	]
};
