import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { listenerKick } from "@/State/listeners/actions";
import { pushTokenUpdated } from "@/notifications/push/actions";
import { selectSourceViews, selectSourceViewById, SourceView } from "@/State/scoped/backups/sources/selectors";
import { getNostrClient } from "@/Api/nostr";
import { getDeviceId } from "@/constants";
import type { RootState } from "@/State/store/store";
import { sourceIdsThatBecameFresh, sourceJustAdded } from "../predicates";
import dLogger from "@/Api/helpers/debugLog";
import { selectPushStatus } from "@/State/runtime/slice";
import { beaconsActions } from "@/State/scoped/beacons/slice";


const log = dLogger.withContext({ component: "push-enrollment" });

function getPushToken(state: RootState) {
	const pushStatus = selectPushStatus(state);
	return pushStatus != null && pushStatus.status === "registered" ? pushStatus.token : null;
}

async function enrollTokenForSources(token: string, views: SourceView[]) {
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
		// When the listener is kicked, we need to enroll the token for all sources
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {
					listenerApi.cancelActiveListeners();
					const state = listenerApi.getState();
					const token = getPushToken(state);
					if (!token) return;
					const sources = selectSourceViews(state);
					await enrollTokenForSources(token, sources);
				}
			}),
		// When the push token is updated (new token), we need to enroll the token for all sources
		(add) =>
			add({
				actionCreator: pushTokenUpdated,
				effect: async (action, listenerApi) => {
					listenerApi.cancelActiveListeners();
					const state = listenerApi.getState();
					const token = getPushToken(state);
					if (!token) return;
					const sources = selectSourceViews(state);
					await enrollTokenForSources(action.payload.token, sources);
				}
			}),
		// when just added
		(add) =>
			add({
				predicate: (action, curr, prev) => sourceJustAdded(action, curr, prev),
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload as { sourceId: string };
					const state = listenerApi.getState();
					const source = selectSourceViewById(state, sourceId);
					if (!source) return;
					const token = getPushToken(state);
					if (!token) return;
					await enrollTokenForSources(token, [source]);
				}
			}),
		// when sources become fresh
		(add) =>
			add({
				actionCreator: beaconsActions.recordBeacon,
				effect: (action, listenerApi) => {
					const curr = listenerApi.getState();
					const token = getPushToken(curr);
					if (!token) return;
					const prev = listenerApi.getOriginalState();
					const views = sourceIdsThatBecameFresh(action.payload.lpk, curr, prev)
						.map(id => selectSourceViewById(curr, id))
						.filter((source): source is SourceView => source != null);
					return enrollTokenForSources(token, views);
				}
			})

	]
};
