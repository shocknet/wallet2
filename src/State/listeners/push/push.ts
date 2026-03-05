import { isAnyOf } from "@reduxjs/toolkit";
import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { listenerKick } from "@/State/listeners/actions";
import { pushTokenUpdated } from "@/notifications/push/actions";
import { getCachedPushToken, hydratePushTokenCache } from "@/notifications/push/tokenCache";
import { selectNprofileViews, selectSourceViewById, NprofileView } from "@/State/scoped/backups/sources/selectors";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { getNostrClient } from "@/Api/nostr";
import { getDeviceId } from "@/constants";
import type { RootState } from "@/State/store/store";
import { becameFresh, exists, isFresh, isNprofile, justAdded } from "../predicates";
import { SourceType } from "@/State/scoped/common";


async function enrollTokenForSources(token: string, state: RootState) {
	const views = selectNprofileViews(state);
	if (!views.length) {
		console.log("[Push] No nprofile sources to enroll token with");
		return;
	}

	console.log(`[Push] Enrolling token with ${views.length} sources`);
	for (const source of views) {
		try {
			const client = await getNostrClient(
				{ pubkey: source.lpk, relays: source.relays },
				source.keys
			);
			const result = await client.EnrollMessagingToken({
				device_id: getDeviceId(),
				firebase_messaging_token: token,
			});
			console.log(`[Push] Enrolled token with source ${source.label}:`, result.status);
		} catch (err) {
			console.error(`[Push] Failed to enroll token with source ${source.label}:`, err);
		}
	}
}

export const pushEnrollmentSpec: ListenerSpec = {
	name: "push-enrollment",
	listeners: [
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {
					await hydratePushTokenCache();
					const token = getCachedPushToken();
					if (!token) return;
					await enrollTokenForSources(token, listenerApi.getState());
				}
			}),
		(add) =>
			add({
				actionCreator: pushTokenUpdated,
				effect: async (action, listenerApi) => {
					listenerApi.cancelActiveListeners();
					await enrollTokenForSources(action.payload.token, listenerApi.getState());
				}
			}),
		(add) =>
			add({
				predicate: (action, curr, prev) =>
				(
					(
						isAnyOf(sourcesActions.applyRemoteSource, sourcesActions._createDraftDoc)(action) &&
						exists(curr, action.payload.sourceId) &&
						isNprofile(curr, action.payload.sourceId) &&
						justAdded(curr, prev, action.payload.sourceId) &&
						isFresh(curr, action.payload.sourceId)
					)
					||
					(
						sourcesActions.recordBeaconForSource.match(action) &&
						exists(curr, action.payload.sourceId) &&
						becameFresh(curr, prev, action.payload.sourceId)
					)
				),
			effect: async (action, listenerApi) => {
				const { sourceId } = action.payload as { sourceId: string };
				const state = listenerApi.getState();
				const source = selectSourceViewById(state, sourceId);
				
				if (!source) {
					console.warn(`[Push] Source ${sourceId} not found for enrollment`);
					return;
				}

				if (source.type !== SourceType.NPROFILE_SOURCE) {
					console.log(`[Push] Source ${source.label} is not an nprofile source, skipping enrollment`);
					return;
				}

				await hydratePushTokenCache();
				const token = getCachedPushToken();
				if (!token) {
					console.log("[Push] No cached token available for new source enrollment");
					return;
				}

				console.log(`[Push] Enrolling token with new/fresh source: ${source.label}`);
				try {
					const nprofileSource = source as NprofileView;
					const client = await getNostrClient(
						{ pubkey: nprofileSource.lpk, relays: nprofileSource.relays },
						nprofileSource.keys
					);
					const result = await client.EnrollMessagingToken({
						device_id: getDeviceId(),
						firebase_messaging_token: token,
					});
					console.log(`[Push] Enrolled token with source ${source.label}:`, result.status);
				} catch (err) {
					console.error(`[Push] Failed to enroll token with source ${source.label}:`, err);
				}
			}
			}),
	]
};
