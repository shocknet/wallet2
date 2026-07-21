import { isAnyOf } from "@reduxjs/toolkit";
import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { listenerKick } from "@/State/listeners/actions";
import { pushTokenUpdated } from "@/notifications/push/actions";
import { selectNprofileViews, selectSourceViewById, NprofileView } from "@/State/scoped/backups/sources/selectors";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { getNostrClient } from "@/Api/nostr";
import { getDeviceId } from "@/constants";
import type { RootState } from "@/State/store/store";
import { becameFresh, exists, isFresh, isNprofile, justAdded } from "../predicates";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import dLogger from "@/Api/helpers/debugLog";
import { runtimeActions, selectPushStatus } from "@/State/runtime/slice";


const log = dLogger.withContext({ component: "push-enrollment" });

function getPushToken(state: RootState) {
	const pushStatus = selectPushStatus(state);
	return pushStatus != null && pushStatus.status === "registered" ? pushStatus.token : null;
}

async function enrollTokenForSources(token: string, views: NprofileView[]) {
	if (!views.length) {
		return;
	}

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
			log.info("enrolled_token_with_source", { data: { sourceLabel: source.label, status: result.status } });
		} catch (err) {
			log.error("failed_to_enroll_token_with_source", { data: { sourceLabel: source.label, error: err instanceof Error ? err.message : "Unknown error" } });
		}
	}
}

export const pushEnrollmentSpec: ListenerSpec = {
	name: "push-enrollment",
	listeners: [
		(add) =>
			add({
				matcher: isAnyOf(runtimeActions.setPushRuntimeStatus, listenerKick),
				effect: async (_, listenerApi) => {
					listenerApi.cancelActiveListeners();
					const state = listenerApi.getState();
					const token = getPushToken(state);
					if (!token) return;
					const sources = selectNprofileViews(state);
					await enrollTokenForSources(token, sources);
				}
			}),
		(add) =>
			add({
				actionCreator: pushTokenUpdated,
				effect: async (action, listenerApi) => {
					listenerApi.cancelActiveListeners();
					const state = listenerApi.getState();
					const token = getPushToken(state);
					if (!token) return;
					const sources = selectNprofileViews(state);
					await enrollTokenForSources(action.payload.token, sources);
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

					const token = getPushToken(state);
					if (!token) {
						console.log("[Push] No cached token available for new source enrollment");
						return;
					}

					console.log(`[Push] Enrolling token with new/fresh source: ${source.label}`);
					await enrollTokenForSources(token, [source]);
				}
			}),
	]
};
