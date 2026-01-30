import { isAnyOf } from "@reduxjs/toolkit";
import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { listenerKick } from "@/State/listeners/actions";
import { pushTokenUpdated } from "@/notifications/push/actions";
import { getCachedPushToken, hydratePushTokenCache } from "@/notifications/push/tokenCache";
import { selectNprofileViews } from "@/State/scoped/backups/sources/selectors";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { getNostrClient } from "@/Api/nostr";
import { getDeviceId } from "@/constants";
import type { RootState } from "@/State/store/store";
import { becameFresh, exists, isFresh, isNprofile, justAdded } from "../predicates";


async function enrollTokenForSources(token: string, state: RootState) {
	const views = selectNprofileViews(state);
	if (!views.length) return;

	for (const source of views) {
		const client = await getNostrClient(
			{ pubkey: source.lpk, relays: source.relays },
			source.keys
		);
		await client.EnrollMessagingToken({
			device_id: getDeviceId(),
			firebase_messaging_token: token,
		});
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
					await hydratePushTokenCache();
					const token = getCachedPushToken();
					if (!token) return;

					const client = await getNostrClient(
						{ pubkey: source.lpk, relays: source.relays },
						source.keys
					);
					await client.EnrollMessagingToken({
						device_id: getDeviceId(),
						firebase_messaging_token: token,
					});
				}
			}),
	]
};
